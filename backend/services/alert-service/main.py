from fastapi import FastAPI, HTTPException, Depends
from typing import List, Dict, Any
import structlog
from pydantic import BaseModel

logger = structlog.get_logger()

app = FastAPI(title="SentinelX Alert Service")

# Dummy DB
MOCK_ALERTS = []

class AlertUpdate(BaseModel):
    status: str
    assignee: str = None

@app.get("/alerts")
async def get_alerts(tenant_id: str = "default_tenant"):
    # In reality, fetch from Supabase `alerts` table with RLS filtering
    return {"alerts": MOCK_ALERTS}

@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: str, tenant_id: str = "default_tenant"):
    for a in MOCK_ALERTS:
        if a["id"] == alert_id:
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@app.patch("/alerts/{alert_id}")
async def update_alert(alert_id: str, payload: AlertUpdate, tenant_id: str = "default_tenant"):
    for a in MOCK_ALERTS:
        if a["id"] == alert_id:
            a["status"] = payload.status
            if payload.assignee:
                a["assignee"] = payload.assignee
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/health")
async def health():
    return {"status": "ok"}
