import asyncio
import structlog
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
import uuid
import json

logger = structlog.get_logger()

# In a real app, rules are cached in Redis from Supabase
MOCK_RULES = [
    {
        "id": "rule-1",
        "name": "Failed Login Spike",
        "type": "threshold",
        "condition": {"event_type": "authentication", "action": "failure"},
        "threshold": 10,
        "window_sec": 300,
        "severity": "high",
        "mitre_tactics": ["Credential Access"]
    }
]

async def evaluate_rules(normalized_event: dict):
    # This is a stub for the complex rule engine evaluation (Sigma, threshold windowing via Redis, etc.)
    # For now, we will simply trigger an alert if event_type is "authentication" and action is "failure"
    
    if normalized_event.get("event_type") == "authentication" and normalized_event.get("action") == "failure":
        alert = {
            "tenant_id": normalized_event.get("tenant_id"),
            "id": str(uuid.uuid4()),
            "rule_id": MOCK_RULES[0]["id"],
            "title": MOCK_RULES[0]["name"],
            "description": "Detected a failed login event matching the threshold rule.",
            "severity": MOCK_RULES[0]["severity"],
            "status": "open",
            "source_events": [normalized_event],
            "mitre_tactics": MOCK_RULES[0]["mitre_tactics"]
        }
        
        logger.warning(f"Rule triggered! Alert created: {alert['id']}")
        
        # In a real app, write to Supabase `alerts` table here
        
        # Push to Kafka alerts topic
        await kafka_producer.produce("alerts", alert, key=alert["tenant_id"])
        
        # Realtime WebSocket stream can listen to this topic or a Redis pubsub channel

async def handle_normalized_log(value: dict, key: str):
    try:
        await evaluate_rules(value)
    except Exception as e:
        logger.error(f"Error in detection engine: {e}")

async def main():
    logger.info("Starting Detection Service")
    consumer = AsyncKafkaConsumer(
        group_id=settings.KAFKA_CONSUMER_GROUP_DETECTION,
        topics=["normalized-logs"]
    )
    
    try:
        await consumer.start(handle_normalized_log)
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        logger.info("Shutting down detection service")
        consumer.stop()
        kafka_producer.flush()

if __name__ == "__main__":
    asyncio.run(main())
