import asyncio
import structlog
import json
import uuid
from datetime import datetime
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
from backend.shared.db.supabase_client import supabase
from backend.shared.detection.engine import detection_engine

logger = structlog.get_logger()

# Rule Cache (Global for this instance)
ACTIVE_RULES = []

async def sync_rules():
    """Syncs active detection rules from Supabase every 5 minutes."""
    global ACTIVE_RULES
    while True:
        try:
            res = supabase.table("detection_rules").select("*").eq("enabled", True).execute()
            ACTIVE_RULES = res.data
            logger.info("Synced detection rules", count=len(ACTIVE_RULES))
        except Exception as e:
            logger.error("Failed to sync rules", error=str(e))
        await asyncio.sleep(300)

async def handle_enriched_event(event: dict, key: str):
    """Evaluates all active rules against the enriched event."""
    tenant_id = event.get("tenant_id")
    
    for rule in ACTIVE_RULES:
        # Check tenant isolation (rules can be global or tenant-specific)
        if rule.get("org_id") and str(rule.get("org_id")) != tenant_id:
            continue
            
        triggered = False
        rule_type = rule.get("rule_type")
        
        if rule_type == "threshold":
            triggered = await detection_engine.evaluate_threshold_rule(event, rule)
        elif rule_type == "simple":
            triggered = detection_engine.evaluate_simple_rule(event, rule)
            
        if triggered:
            await create_alert(event, rule)

async def create_alert(event: dict, rule: dict):
    """Creates an alert in Supabase and pushes to Kafka."""
    tenant_id = event.get("tenant_id")
    alert_id = str(uuid.uuid4())
    
    alert = {
        "id": alert_id,
        "org_id": rule.get("org_id"),
        "rule_id": rule.get("id"),
        "title": rule.get("name"),
        "description": f"Rule '{rule.get('name')}' triggered by event from {event.get('source')}",
        "severity": rule.get("severity", "high"),
        "status": "open",
        "source_events": [event],
        "mitre_tactics": rule.get("mitre_tactics", []),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        # 1. Push to Kafka (Realtime)
        await kafka_producer.produce("alerts", alert, key=tenant_id)
        
        # 2. Persist to Supabase
        # We use a background task for this to not block the detection stream
        asyncio.create_task(persist_alert_to_db(alert))
        
        logger.warning("ALERT TRIGGERED", rule_name=rule.get("name"), tenant_id=tenant_id)
    except Exception as e:
        logger.error("Failed to process alert", error=str(e))

async def persist_alert_to_db(alert: dict):
    try:
        supabase.table("alerts").insert(alert).execute()
    except Exception as e:
        logger.error("Failed to persist alert to DB", error=str(e))

async def main():
    logger.info("Starting Detection Service")
    
    # Start rule syncer
    asyncio.create_task(sync_rules())
    
    consumer = AsyncKafkaConsumer(
        group_id=settings.KAFKA_CONSUMER_GROUP_DETECTION,
        topics=["enriched-events"]
    )
    
    try:
        await consumer.start(handle_enriched_event)
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        logger.info("Shutting down detection service")
        consumer.stop()
        kafka_producer.flush()

if __name__ == "__main__":
    asyncio.run(main())
