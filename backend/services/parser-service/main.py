import asyncio
import structlog
import json
from datetime import datetime
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
from backend.shared.parsers.json_parser import JsonParser
from backend.shared.parsers.syslog_parser import SyslogParser
from backend.shared.parsers.winevent_parser import WindowsEventParser
from backend.shared.parsers.registry import parser_registry
from backend.shared.models.events import SentinelXEvent

logger = structlog.get_logger()

# Register default parsers
parser_registry.register(JsonParser())
parser_registry.register(SyslogParser())
parser_registry.register(WindowsEventParser())

async def insert_to_clickhouse_batch(events: list):
    """
    Placeholder for ClickHouse batch insertion.
    Will use clickhouse-connect in the next step.
    """
    if events:
        logger.info("Batch inserting to ClickHouse", count=len(events))

async def handle_raw_log(value: dict, key: str):
    """
    Processes raw logs from Kafka, applies parsing, and forwards to normalized topic.
    """
    tenant_id = value.get("tenant_id")
    raw_payload = value.get("raw")
    source_type = value.get("source", "generic")
    
    # 1. Identify Parser
    parser = parser_registry.get_parser_for_source(source_type)
    if not parser:
        # Fallback to generic JSON parser
        parser = parser_registry.get_parser("generic_json")

    # 2. Parse & Normalize
    normalized_event: SentinelXEvent = parser.parse(raw_payload, tenant_id)
    
    if not normalized_event:
        logger.warning("Parsing failed", source=source_type, tenant_id=tenant_id)
        # In production, we'd send to a parsing-failed DLQ
        return

    # 3. Forward to Enrichment (Enrichment service will consume this)
    # The enrichment service will then write to ClickHouse and Detection topic
    await kafka_producer.produce(
        "normalized-logs", 
        normalized_event.model_dump(mode="json"), 
        key=tenant_id
    )
    
    # Also forward to a dedicated topic for high-volume storage pipeline
    # await kafka_producer.produce("telemetry-storage", normalized_event.model_dump(mode="json"), key=tenant_id)

async def main():
    logger.info("Starting Parser Service")
    consumer = AsyncKafkaConsumer(
        group_id=settings.KAFKA_CONSUMER_GROUP_PARSER,
        topics=["raw-logs"]
    )
    
    try:
        await consumer.start(handle_raw_log)
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        logger.info("Shutting down parser service")
        consumer.stop()
        kafka_producer.flush()

if __name__ == "__main__":
    asyncio.run(main())
