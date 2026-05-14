import asyncio
import structlog
import json
import time
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
from backend.shared.cache.redis_client import redis_client

logger = structlog.get_logger()

async def enrich_geoip(event: dict) -> dict:
    """Enriches event with GeoIP data (Mock for now, would use MaxMind)."""
    if event.get("source_ip"):
        # Mock GeoIP lookup
        event["geoip"] = {
            "country": "United States",
            "city": "San Francisco",
            "lat": 37.7749,
            "lon": -122.4194,
            "asn": 15169,
            "isp": "Google LLC"
        }
    return event

async def check_threat_intel(event: dict) -> dict:
    """Checks source/destination IPs against threat intel IOCs in Redis."""
    # In production, this would check a Redis set of known bad IPs
    src_ip = event.get("source_ip")
    if src_ip:
        is_malicious = await redis_client.sismember("intel:ioc:ip", src_ip)
        if is_malicious:
            event["tags"].append("threat_intel_match")
            event["severity"] = "critical"
            event["severity_score"] = 90
    return event

async def handle_normalized_log(value: dict, key: str):
    """
    Enriches normalized logs and forwards to detection and storage.
    """
    try:
        tenant_id = value.get("tenant_id")
        
        # 1. Enrichments
        value = await enrich_geoip(value)
        value = await check_threat_intel(value)
        
        # 2. Add enrichment metadata
        value["enriched_at"] = time.time()
        
        # 3. Forward to Detection
        await kafka_producer.produce("enriched-events", value, key=tenant_id)
        
        # 4. Forward to storage topic (ClickHouse ingestor)
        # We can also write directly to ClickHouse here if we want to combine services
        
    except Exception as e:
        logger.error("Enrichment failed", error=str(e))

async def main():
    logger.info("Starting Enrichment Service")
    consumer = AsyncKafkaConsumer(
        group_id="enrichment-group",
        topics=["normalized-logs"]
    )
    
    try:
        await consumer.start(handle_normalized_log)
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        logger.info("Shutting down enrichment service")
        consumer.stop()
        kafka_producer.flush()

if __name__ == "__main__":
    asyncio.run(main())
