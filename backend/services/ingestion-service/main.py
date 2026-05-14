from fastapi import FastAPI, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
import structlog
import uuid
from typing import List, Dict, Any, Optional

from backend.shared.models.events import RawLogPayload
from backend.shared.kafka.producer import kafka_producer
from backend.shared.config import settings

logger = structlog.get_logger()

app = FastAPI(title="SentinelX Ingestion Service")

# Mock function to validate API Key and return tenant_id
async def verify_api_key(x_api_key: str = Header(...)) -> str:
    # In a real app, query Supabase `api_keys` to validate and get org_id
    if not x_api_key.startswith("sx_"):
        raise HTTPException(status_code=401, detail="Invalid API Key")
    # For now, return a dummy tenant ID based on the key
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, x_api_key))

@app.post("/ingest")
async def ingest_single(payload: Dict[str, Any], tenant_id: str = Depends(verify_api_key)):
    """Ingest a single log event."""
    try:
        # Wrap it in standard envelope if not already
        kafka_payload = {
            "tenant_id": tenant_id,
            "source": payload.get("source", "generic"),
            "raw": payload,
            "ingestion_id": str(uuid.uuid4())
        }
        await kafka_producer.produce("raw-logs", kafka_payload, key=tenant_id)
        return JSONResponse(status_code=202, content={"status": "accepted", "id": kafka_payload["ingestion_id"]})
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/ingest/bulk")
async def ingest_bulk(payload: RawLogPayload, tenant_id: str = Depends(verify_api_key)):
    """Ingest a batch of log events."""
    if len(payload.events) > 10000:
        raise HTTPException(status_code=413, detail="Payload too large. Max 10000 events.")
    
    try:
        count = 0
        for event in payload.events:
            kafka_payload = {
                "tenant_id": tenant_id,
                "source": payload.source,
                "raw": event,
                "ingestion_id": str(uuid.uuid4())
            }
            await kafka_producer.produce("raw-logs", kafka_payload, key=tenant_id)
            count += 1
        return JSONResponse(status_code=202, content={"status": "accepted", "events_processed": count})
    except Exception as e:
        logger.error(f"Bulk ingestion failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/health")
async def health():
    return {"status": "ok"}
