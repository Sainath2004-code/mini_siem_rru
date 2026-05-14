from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class BaseLogEvent(BaseModel):
    tenant_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str
    event_type: str
    severity: str
    hostname: Optional[str] = None
    user: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    action: Optional[str] = None
    raw: Dict[str, Any] = Field(default_factory=dict)
    normalized: Dict[str, Any] = Field(default_factory=dict)

class RawLogPayload(BaseModel):
    source: str
    events: list[Dict[str, Any]]
