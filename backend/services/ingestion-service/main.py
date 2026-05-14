from fastapi import FastAPI, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
import structlog
import uuid
import time
import hashlib
from typing import List, Dict, Any, Optional
from prometheus_client import Counter, Histogram, make_asgi_app

from backend.shared.models.events import RawLogPayload
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings
from backend.shared.db.supabase_client import supabase
from backend.shared.cache.redis_client import redis_client

logger = structlog.get_logger()

app = FastAPI(title="SentinelX Ingestion Service")

# Prometheus Metrics
INGESTED_EVENTS = Counter("ingestion_events_total", "Total events ingested", ["tenant_id", "source"])
INGESTION_LATENCY = Histogram("ingestion_latency_seconds", "Latency of ingestion requests", ["method"])
AUTH_FAILURES = Counter("ingestion_auth_failures_total", "Total authentication failures")

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

async def verify_api_key(x_api_key: str = Header(...)) -> str:
    """Verifies API key against Supabase with Redis caching."""
    if not x_api_key:
        AUTH_FAILURES.inc()
        raise HTTPException(status_code=401, detail="API Key missing")

    # 1. Check Redis Cache
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    cache_key = f"auth:apikey:{key_hash}"
    cached_tenant = await redis_client.get(cache_key)
    
    if cached_tenant:
        return cached_tenant

    # 2. Check Supabase
    try:
        # We store the hash in DB for security
        res = supabase.table("api_keys").select("org_id").eq("key_hash", key_hash).eq("revoked", False).execute()
        if not res.data:
            AUTH_FAILURES.inc()
            raise HTTPException(status_code=401, detail="Invalid or revoked API Key")
        
        tenant_id = res.data[0]["org_id"]
        
        # 3. Cache result for 1 hour
        await redis_client.setex(cache_key, 3600, tenant_id)
        return tenant_id
    except Exception as e:
        logger.error(f"Auth database error: {e}")
        raise HTTPException(status_code=500, detail="Authentication Service Unavailable")

async def check_rate_limit(tenant_id: str):
    """Simple sliding window rate limiting via Redis."""
    key = f"ratelimit:ingest:{tenant_id}:{int(time.time() / 60)}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, 60)
    
    # Limit to 100k events per minute per tenant (example)
    if count > 100000:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

@app.post("/ingest")
async def ingest_single(payload: Dict[str, Any], tenant_id: str = Depends(verify_api_key)):
    """Ingest a single log event."""
    start_time = time.time()
    await check_rate_limit(tenant_id)
    
    try:
        source = payload.get("source", "generic")
        ingestion_id = str(uuid.uuid4())
        
        kafka_payload = {
            "tenant_id": tenant_id,
            "source": source,
            "raw": payload,
            "ingestion_id": ingestion_id,
            "received_at": time.time()
        }
        
        await kafka_producer.produce("raw-logs", kafka_payload, key=tenant_id)
        
        INGESTED_EVENTS.labels(tenant_id=tenant_id, source=source).inc()
        INGESTION_LATENCY.labels(method="single").observe(time.time() - start_time)
        
        return JSONResponse(status_code=202, content={"status": "accepted", "id": ingestion_id})
    except Exception as e:
        logger.error(f"Ingestion failed", error=str(e), tenant_id=tenant_id)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/ingest/bulk")
async def ingest_bulk(payload: RawLogPayload, tenant_id: str = Depends(verify_api_key)):
    """Ingest a batch of log events with high throughput optimization."""
    start_time = time.time()
    await check_rate_limit(tenant_id)
    
    if len(payload.events) > 10000:
        raise HTTPException(status_code=413, detail="Batch too large. Max 10,000 events.")
    
    try:
        # Prepare batch for Kafka
        # In a real high-throughput scenario, we'd use a background task or more efficient batching
        tasks = []
        for event in payload.events:
            kafka_payload = {
                "tenant_id": tenant_id,
                "source": payload.source,
                "raw": event,
                "ingestion_id": str(uuid.uuid4()),
                "received_at": time.time()
            }
            tasks.append(kafka_producer.produce("raw-logs", kafka_payload, key=tenant_id))
        
        await asyncio.gather(*tasks)
        
        INGESTED_EVENTS.labels(tenant_id=tenant_id, source=payload.source).inc(len(payload.events))
        INGESTION_LATENCY.labels(method="bulk").observe(time.time() - start_time)
        
        return JSONResponse(status_code=202, content={"status": "accepted", "events_processed": len(payload.events)})
    except Exception as e:
        logger.error(f"Bulk ingestion failed", error=str(e), tenant_id=tenant_id)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}
