from fastapi import FastAPI, HTTPException, Header
from typing import List, Optional, Dict, Any
import structlog
import uuid
from pydantic import BaseModel
from backend.shared.db.supabase_client import supabase

logger = structlog.get_logger()
app = FastAPI(title="SentinelX Asset Service")

class Asset(BaseModel):
    name: str
    asset_type: str # host, user, cloud_resource, subnet
    ip_addresses: List[str] = []
    mac_addresses: List[str] = []
    owner: Optional[str] = None
    criticality: str = "medium"
    tags: List[str] = []

@app.get("/assets")
async def list_assets(x_tenant_id: str = Header(...)):
    res = supabase.table("assets").select("*").eq("org_id", x_tenant_id).execute()
    return res.data

@app.post("/assets")
async def register_asset(payload: Asset, x_tenant_id: str = Header(...)):
    asset_id = str(uuid.uuid4())
    asset_data = payload.model_dump()
    asset_data.update({
        "id": asset_id,
        "org_id": x_tenant_id,
        "risk_score": 0,
        "last_seen": "now()"
    })
    
    supabase.table("assets").insert(asset_data).execute()
    return asset_data

@app.get("/assets/lookup")
async def lookup_asset(ip: str = None, host: str = None, x_tenant_id: str = Header(...)):
    """Lookup asset details by IP or Hostname."""
    query = supabase.table("assets").select("*").eq("org_id", x_tenant_id)
    if ip:
        query = query.contains("ip_addresses", [ip])
    elif host:
        query = query.eq("name", host)
    
    res = query.execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return res.data[0]

@app.get("/health")
async def health():
    return {"status": "ok"}
