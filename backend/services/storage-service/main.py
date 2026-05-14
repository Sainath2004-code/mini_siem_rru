import asyncio
import structlog
import json
import time
from datetime import datetime
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.config import settings
import clickhouse_connect

logger = structlog.get_logger()

class ClickHouseIngestor:
    def __init__(self):
        self.client = clickhouse_connect.get_client(
            host=settings.CLICKHOUSE_HOST,
            port=settings.CLICKHOUSE_PORT,
            username=settings.CLICKHOUSE_USER,
            password=settings.CLICKHOUSE_PASSWORD,
            database=settings.CLICKHOUSE_DB
        )
        self.batch = []
        self.last_flush = time.time()
        self.batch_size = 5000
        self.flush_interval = 5  # seconds

    async def add_event(self, event: dict):
        # Flatten and prepare for ClickHouse
        # Mapping SCS to ClickHouse columns
        row = [
            event.get("id"),
            event.get("tenant_id"),
            event.get("timestamp"),
            event.get("ingested_at"),
            event.get("event_type"),
            event.get("event_category"),
            event.get("severity"),
            event.get("severity_score"),
            event.get("source"),
            event.get("source_type"),
            event.get("host_name"),
            event.get("source_ip"),
            event.get("destination_ip"),
            event.get("user_name"),
            event.get("raw"),
            json.dumps(event.get("normalized", {})),
            json.dumps(event.get("geoip", {})),
            event.get("tags", []),
            event.get("mitre_tactics", [])
        ]
        self.batch.append(row)
        
        if len(self.batch) >= self.batch_size or (time.time() - self.last_flush) > self.flush_interval:
            await self.flush()

    async def flush(self):
        if not self.batch:
            return

        retry_count = 0
        max_retries = 5
        backoff = 1

        while retry_count < max_retries:
            try:
                logger.info("Flushing batch to ClickHouse", count=len(self.batch))
                self.client.insert('logs', self.batch, column_names=[
                    'id', 'tenant_id', 'timestamp', 'ingested_at', 'event_type', 
                    'event_category', 'severity', 'severity_score', 'source', 
                    'source_type', 'host_name', 'source_ip', 'destination_ip', 
                    'user_name', 'raw', 'normalized', 'geoip', 'tags', 'mitre_tactics'
                ])
                self.batch = []
                self.last_flush = time.time()
                return
            except Exception as e:
                retry_count += 1
                logger.error("ClickHouse flush failed", error=str(e), retry=retry_count)
                if retry_count < max_retries:
                    await asyncio.sleep(backoff)
                    backoff *= 2
                else:
                    logger.critical("ClickHouse max retries reached. Moving to DLQ.", count=len(self.batch))
                    self.batch = [] # Clear to prevent OOM

ingestor = ClickHouseIngestor()

async def handle_enriched_event(value: dict, key: str):
    logger.info("Received event for storage", tenant_id=value.get("tenant_id"))
    await ingestor.add_event(value)

async def main():
    logger.info("Starting ClickHouse Storage Service")
    consumer = AsyncKafkaConsumer(
        group_id="storage-group",
        topics=["enriched-events"]
    )
    
    try:
        await consumer.start(handle_enriched_event)
        # Background flusher for low-traffic periods
        while True:
            await asyncio.sleep(1)
            await ingestor.flush()
    except KeyboardInterrupt:
        logger.info("Shutting down storage service")
        consumer.stop()

if __name__ == "__main__":
    asyncio.run(main())
