"""
SentinelX WebSocket Gateway
Broadcasts realtime events to connected SOC clients.

Event types pushed to clients:
  - new_alert       : A new alert was triggered
  - live_log        : A normalized log event
  - incident_update : An incident changed status
  - metric_tick     : Dashboard metric heartbeat (5s interval)
"""

import asyncio
import json
import uuid
from typing import Dict, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
import redis.asyncio as aioredis
import structlog
from backend.shared.config import settings

logger = structlog.get_logger()
app = FastAPI(title="SentinelX WebSocket Gateway")

# ----------------------------------------------------------------
# Connection Manager — per-tenant connection pooling
# ----------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        # tenant_id -> set of active websocket connections
        self.connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, tenant_id: str, ws: WebSocket):
        await ws.accept()
        if tenant_id not in self.connections:
            self.connections[tenant_id] = set()
        self.connections[tenant_id].add(ws)
        logger.info(f"Client connected to tenant {tenant_id}. Total: {len(self.connections[tenant_id])}")

    def disconnect(self, tenant_id: str, ws: WebSocket):
        if tenant_id in self.connections:
            self.connections[tenant_id].discard(ws)
            if not self.connections[tenant_id]:
                del self.connections[tenant_id]

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        conns = self.connections.get(tenant_id, set()).copy()
        dead = set()
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(tenant_id, ws)

manager = ConnectionManager()

# ----------------------------------------------------------------
# JWT Verification Helper
# ----------------------------------------------------------------
def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

# ----------------------------------------------------------------
# WebSocket Endpoint
# ----------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(
    ws: WebSocket,
    token: str = Query(..., description="JWT access token for authentication")
):
    payload = verify_token(token)
    if not payload:
        await ws.close(code=4001)
        return

    tenant_id = payload.get("org_id", "unknown")
    await manager.connect(tenant_id, ws)

    try:
        # Send welcome message
        await ws.send_json({
            "type": "connected",
            "tenant_id": tenant_id,
            "message": "SentinelX realtime stream active"
        })

        # Keep connection alive; the Redis subscriber does the broadcasting
        while True:
            try:
                # Heartbeat every 30s to detect dead connections
                await asyncio.wait_for(ws.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                await ws.send_json({"type": "ping"})
    except WebSocketDisconnect:
        manager.disconnect(tenant_id, ws)
        logger.info(f"Client disconnected from tenant {tenant_id}")

# ----------------------------------------------------------------
# Redis PubSub Broadcaster (background task)
# Subscribes to all tenant channels and broadcasts to connected WS clients
# ----------------------------------------------------------------
async def redis_pubsub_listener():
    r = aioredis.from_url(settings.REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.psubscribe("sentinelx:*")   # Pattern subscribe to all tenant channels

    logger.info("Redis PubSub listener started")
    async for message in pubsub.listen():
        if message["type"] == "pmessage":
            try:
                channel = message["channel"]
                # Channel format: sentinelx:{tenant_id}:{event_type}
                parts = channel.split(":")
                if len(parts) >= 3:
                    tenant_id = parts[1]
                    data = json.loads(message["data"])
                    await manager.broadcast_to_tenant(tenant_id, data)
            except Exception as e:
                logger.error(f"PubSub broadcast error: {e}")

# ----------------------------------------------------------------
# Metric Heartbeat (every 5 seconds)
# Simulates live EPS, alert count, active incidents
# ----------------------------------------------------------------
async def metric_heartbeat():
    import random
    r = aioredis.from_url(settings.REDIS_URL)
    while True:
        await asyncio.sleep(5)
        # In production, read real metrics from Redis/Prometheus
        for tenant_id in list(manager.connections.keys()):
            metric = {
                "type": "metric_tick",
                "eps": random.randint(8000, 15000),
                "active_alerts": random.randint(100, 200),
                "open_incidents": random.randint(5, 15),
                "ingestion_lag_ms": random.randint(50, 300)
            }
            await manager.broadcast_to_tenant(tenant_id, metric)
    await r.aclose()

@app.on_event("startup")
async def startup():
    asyncio.create_task(redis_pubsub_listener())
    asyncio.create_task(metric_heartbeat())
    logger.info("WebSocket Gateway started")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "websocket-gateway",
        "active_tenants": len(manager.connections),
        "total_connections": sum(len(v) for v in manager.connections.values())
    }
