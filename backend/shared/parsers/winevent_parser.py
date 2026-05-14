import json
import time
from typing import Dict, Any, Optional
from backend.shared.parsers.base import BaseParser
from backend.shared.models.events import SentinelXEvent

class WindowsEventParser(BaseParser):
    @property
    def name(self) -> str:
        return "windows_event"

    def parse(self, raw_data: Any, tenant_id: str) -> Optional[SentinelXEvent]:
        # Usually Windows events come as JSON from Winlogbeat or NXLog
        try:
            if isinstance(raw_data, str):
                data = json.loads(raw_data)
            else:
                data = raw_data
            
            # Extract standard fields
            event_id = data.get("event_id") or data.get("EventID")
            task = data.get("task") or data.get("Task")
            
            # Map EventID to Severity (Simplified)
            critical_ids = [4624, 4625, 4720, 4732] # Auth, Account Created, Group Changed
            severity = "medium"
            score = 50
            if event_id in [4625]: severity, score = "high", 75
            if event_id in [4720]: severity, score = "critical", 90
            
            return SentinelXEvent(
                tenant_id=tenant_id,
                timestamp=data.get("@timestamp") or data.get("TimeCreated", {}).get("SystemTime") or time.time(),
                event_type="windows_event",
                event_category="endpoint",
                severity=severity,
                severity_score=score,
                source=data.get("computer_name") or data.get("Computer"),
                source_type="windows",
                host_name=data.get("computer_name") or data.get("Computer"),
                user_name=data.get("user", {}).get("name") or data.get("TargetUserName"),
                source_ip=data.get("source_ip") or data.get("IpAddress"),
                raw=json.dumps(raw_data),
                normalized={
                    "event_id": event_id,
                    "task": task,
                    "channel": data.get("channel"),
                    "provider": data.get("provider_name")
                }
            )
        except Exception:
            return None

    @property
    def source_type(self) -> str:
        return "windows"
