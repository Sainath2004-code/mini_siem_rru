import asyncio
import structlog
from datetime import datetime
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
import uuid

logger = structlog.get_logger()

# Dummy ClickHouse insert function
async def insert_to_clickhouse(normalized_event: dict):
    # In reality, this would batch inserts to ClickHouse using clickhouse-connect
    pass

async def handle_raw_log(value: dict, key: str):
    try:
        tenant_id = value.get("tenant_id")
        raw = value.get("raw", {})
        source = value.get("source", "generic")
        
        # 1. Parsing logic
        # Mocking parsing:
        normalized = {
            "tenant_id": tenant_id,
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": source,
            "event_type": raw.get("event_type", "unknown"),
            "severity": raw.get("severity", "info"),
            "hostname": raw.get("hostname", ""),
            "user_field": raw.get("user", ""),
            "source_ip": raw.get("source_ip", ""),
            "destination_ip": raw.get("destination_ip", ""),
            "action": raw.get("action", ""),
            "raw": str(raw),
            "normalized": "{}"
        }
        
        # 2. Enrichments (GeoIP, Threat Intel) could happen here
        
        # 3. Store to ClickHouse
        await insert_to_clickhouse(normalized)
        
        # 4. Produce to normalized topic for Detection engine
        await kafka_producer.produce("normalized-logs", normalized, key=tenant_id)
        
    except Exception as e:
        logger.error(f"Error parsing log: {e}")

async def main():
    logger.info("Starting Parser Service")
    consumer = AsyncKafkaConsumer(
        group_id=settings.KAFKA_CONSUMER_GROUP_PARSER,
        topics=["raw-logs"]
    )
    
    try:
        await consumer.start(handle_raw_log)
        # Keep alive
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        logger.info("Shutting down parser service")
        consumer.stop()
        kafka_producer.flush()

if __name__ == "__main__":
    asyncio.run(main())
