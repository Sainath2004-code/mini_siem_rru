from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

class SentinelXEvent(BaseModel):
    """
    SentinelX Common Schema (SCS) - Production Ready
    Modeled after ECS (Elastic Common Schema) but optimized for SentinelX.
    """
    # Core Metadata
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ingested_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Event Info
    event_type: str = "unknown"
    event_category: str = "base"
    event_action: Optional[str] = None
    event_outcome: str = "success"
    severity: str = "info"
    severity_score: int = 20  # 0-100
    
    # Source Info
    source: str
    source_type: str = "generic" # syslog, cloudtrail, etc.
    
    # Host Info
    host_name: Optional[str] = None
    host_ip: Optional[str] = None
    host_os: Optional[str] = None
    
    # Network Info
    source_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_ip: Optional[str] = None
    destination_port: Optional[int] = None
    network_protocol: Optional[str] = None
    
    # User Info
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_domain: Optional[str] = None
    
    # File/Process Info
    file_path: Optional[str] = None
    process_name: Optional[str] = None
    process_pid: Optional[int] = None
    
    # Tags & Enrichment
    tags: List[str] = Field(default_factory=list)
    mitre_tactics: List[str] = Field(default_factory=list)
    mitre_techniques: List[str] = Field(default_factory=list)
    geoip: Dict[str, Any] = Field(default_factory=dict)
    
    # Payload
    raw: str  # Original raw string
    normalized: Dict[str, Any] = Field(default_factory=dict) # Key-value pairs extracted

class RawLogPayload(BaseModel):
    source: str
    events: List[Dict[str, Any]]
