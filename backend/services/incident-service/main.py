from fastapi import FastAPI, HTTPException, Header, Depends, Body
from typing import List, Optional, Dict, Any
import structlog
import uuid
import time
from datetime import datetime
from pydantic import BaseModel

from backend.shared.db.supabase_client import supabase
from backend.shared.config import settings

logger = structlog.get_logger()
app = FastAPI(title="SentinelX Incident Service")

class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    severity: str = "medium"
    alert_ids: List[str] = []
    mitre_tactics: List[str] = []

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assignee_id: Optional[str] = None
    resolution_note: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

@app.get("/incidents")
async def list_incidents(x_tenant_id: str = Header(...), status: Optional[str] = None):
    """Lists incidents for a tenant."""
    query = supabase.table("incidents").select("*, alerts(*)").eq("org_id", x_tenant_id)
    if status:
        query = query.eq("status", status)
    
    try:
        res = query.order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        logger.error("Failed to fetch incidents", error=str(e))
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/incidents")
async def create_incident(payload: IncidentCreate, x_tenant_id: str = Header(...)):
    """Creates a new incident from one or more alerts."""
    incident_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    
    incident = {
        "id": incident_id,
        "org_id": x_tenant_id,
        "title": payload.title,
        "description": payload.description,
        "severity": payload.severity,
        "status": "open",
        "created_at": now,
        "updated_at": now,
        "mitre_tactics": payload.mitre_tactics
    }
    
    try:
        # 1. Create Incident
        supabase.table("incidents").insert(incident).execute()
        
        # 2. Link Alerts
        if payload.alert_ids:
            # Update alerts with incident_id
            supabase.table("alerts").update({"incident_id": incident_id, "status": "linked"}).in_("id", payload.alert_ids).execute()
            
        logger.info("Incident created", id=incident_id, tenant_id=x_tenant_id)
        return incident
    except Exception as e:
        logger.error("Failed to create incident", error=str(e))
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/incidents/{id}")
async def get_incident(id: str, x_tenant_id: str = Header(...)):
    """Fetches full incident details including alerts and timeline."""
    try:
        # 1. Get Incident & Alerts
        res = supabase.table("incidents").select("*, alerts(*)").eq("id", id).eq("org_id", x_tenant_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # 2. Get Timeline/Comments
        comments = supabase.table("incident_comments").select("*").eq("incident_id", id).order("created_at").execute()
        
        data = res.data
        data["comments"] = comments.data
        return data
    except Exception as e:
        logger.error("Failed to fetch incident", id=id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@app.patch("/incidents/{id}")
async def update_incident(id: str, payload: IncidentUpdate, x_tenant_id: str = Header(...)):
    """Updates incident status, severity or assignee."""
    update_data = payload.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    try:
        res = supabase.table("incidents").update(update_data).eq("id", id).eq("org_id", x_tenant_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Incident not found")
        return res.data[0]
    except Exception as e:
        logger.error("Update failed", id=id, error=str(e))
        raise HTTPException(status_code=500, detail="Update failed")

@app.post("/incidents/{id}/comment")
async def add_comment(id: str, payload: CommentCreate, x_tenant_id: str = Header(...), x_user_id: str = Header(...)):
    """Adds an analyst comment to an incident."""
    comment = {
        "id": str(uuid.uuid4()),
        "incident_id": id,
        "org_id": x_tenant_id,
        "user_id": x_user_id,
        "content": payload.content,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        supabase.table("incident_comments").insert(comment).execute()
        return comment
    except Exception as e:
        logger.error("Comment failed", id=id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to add comment")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "incident-service"}
