import asyncio
import structlog
import json
import time
from backend.shared.kafka.consumer import AsyncKafkaConsumer
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
from backend.shared.cache.redis_client import redis_client

logger = structlog.get_logger()

import geoip2.database
from ipaddress import ip_address

# Initialize MaxMind reader (Path would be configured in settings)
# In production, this file is updated weekly via a cron job
GEOIP_READER = None
try:
    GEOIP_READER = geoip2.database.Reader(settings.GEOIP_DB_PATH)
except Exception as e:
    logger.error("Failed to load GeoIP database", error=str(e))

async def enrich_geoip(event: dict) -> dict:
    """Enriches event with real GeoIP data using MaxMind and Redis cache."""
    ip = event.get("source_ip")
    if not ip or not GEOIP_READER:
        return event

    try:
        # 1. Skip private IPs
        addr = ip_address(ip)
        if addr.is_private:
            event["geoip"] = {"city": "internal", "country": "internal", "isp": "internal"}
            return event

        # 2. Check Redis Cache
        cache_key = f"geoip:cache:{ip}"
        cached = await redis_client.get(cache_key)
        if cached:
            event["geoip"] = json.loads(cached)
            return event

        # 3. Real Lookup
        response = GEOIP_READER.city(ip)
        geo_data = {
            "country": response.country.name,
            "country_code": response.country.iso_code,
            "city": response.city.name,
            "lat": response.location.latitude,
            "lon": response.location.longitude,
            "asn": None, # Requires GeoLite2-ASN db
            "isp": None
        }
        
        # 4. Cache for 24h
        await redis_client.setex(cache_key, 86400, json.dumps(geo_data))
        event["geoip"] = geo_data
        
    except Exception as e:
        logger.debug("GeoIP lookup failed", ip=ip, error=str(e))
    
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
