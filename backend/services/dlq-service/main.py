import asyncio
import structlog
import json
from typing import List, Dict, Any
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
from backend.shared.db.supabase_client import supabase

logger = structlog.get_logger()

class DLQManager:
    def __init__(self):
        self.dlq_topics = ["raw-logs-dlq", "normalized-logs-dlq", "storage-dlq"]
        self.consumer = AsyncKafkaConsumer(
            group_id="dlq-manager-group",
            topics=self.dlq_topics
        )

    async def start(self):
        """Starts monitoring all DLQ topics."""
        logger.info("DLQ Manager active", topics=self.dlq_topics)
        await self.consumer.start(self.handle_dlq_message)

    async def handle_dlq_message(self, value: dict, key: str):
        """Persists failed messages to Supabase for manual inspection."""
        error_payload = {
            "id": value.get("ingestion_id") or value.get("id"),
            "topic": "dlq", # We'd ideally pass the source topic here
            "payload": value,
            "error": value.get("error_reason", "unknown_failure"),
            "timestamp": value.get("received_at") or value.get("timestamp") or time.time(),
            "org_id": value.get("tenant_id")
        }
        
        try:
            supabase.table("dead_letter_queue").insert(error_payload).execute()
            logger.error("Message moved to DLQ storage", id=error_payload["id"])
        except Exception as e:
            logger.error("Failed to persist DLQ message", error=str(e))

    async def replay(self, dlq_id: str):
        """Replays a message back to its original pipeline."""
        res = supabase.table("dead_letter_queue").select("*").eq("id", dlq_id).single().execute()
        if not res.data:
            return False
            
        data = res.data
        original_topic = data["payload"].get("original_topic", "raw-logs")
        
        # Strip error metadata before replay
        payload = data["payload"]
        if "error_reason" in payload: del payload["error_reason"]
        
        await kafka_producer.produce(original_topic, payload, key=data["org_id"])
        
        # Delete from DLQ after successful replay
        supabase.table("dead_letter_queue").delete().eq("id", dlq_id).execute()
        return True

async def main():
    manager = DLQManager()
    
    # Fast API for Replay Control
    from fastapi import FastAPI
    app = FastAPI(title="SentinelX DLQ Service")
    
    @app.post("/dlq/replay/{id}")
    async def replay_event(id: str):
        success = await manager.replay(id)
        if not success:
            raise HTTPException(status_code=404, detail="DLQ item not found")
        return {"status": "replayed"}
    
    @app.get("/health")
    async def health():
        return {"status": "ok"}
    
    # Start consumer and server
    asyncio.create_task(manager.start())
    
    import uvicorn
    config = uvicorn.Config(app, host="0.0.0.0", port=9111)
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
