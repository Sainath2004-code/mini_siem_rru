import json
from typing import Dict, Any, Optional
from datetime import datetime
from backend.shared.parsers.base import BaseParser
from backend.shared.models.events import SentinelXEvent

class JsonParser(BaseParser):
    @property
    def name(self) -> str:
        return "generic_json"

    @property
    def source_type(self) -> str:
        return "generic"

    def parse(self, raw_data: Any, tenant_id: str) -> Optional[SentinelXEvent]:
        try:
            # If raw_data is already a dict, use it, otherwise parse string
            data = raw_data if isinstance(raw_data, dict) else json.loads(raw_data)
            
            # Map fields to SCS
            event = SentinelXEvent(
                tenant_id=tenant_id,
                timestamp=data.get("timestamp") or data.get("@timestamp") or datetime.utcnow(),
                source="generic_json",
                source_type=self.source_type,
                event_type=data.get("event_type", "unknown"),
                severity=data.get("severity", "info"),
                host_name=data.get("hostname") or data.get("host"),
                source_ip=data.get("source_ip") or data.get("src_ip"),
                destination_ip=data.get("destination_ip") or data.get("dst_ip"),
                user_name=data.get("user") or data.get("username"),
                raw=json.dumps(data),
                normalized=data
            )
            return event
        except Exception:
            return None
