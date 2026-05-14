import re
import time
from typing import Dict, Any, Optional
from datetime import datetime
from backend.shared.parsers.base import BaseParser
from backend.shared.models.events import SentinelXEvent

class SyslogParser(BaseParser):
    @property
    def name(self) -> str:
        return "syslog"

    def __init__(self):
        # RFC 5424 Regex
        # <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID [STRUCTURED-DATA] MSG
        self.rfc5424_regex = re.compile(
            r'^<(?P<pri>\d+)>(?P<version>\d+) (?P<timestamp>[^ ]+) (?P<hostname>[^ ]+) (?P<app_name>[^ ]+) (?P<procid>[^ ]+) (?P<msgid>[^ ]+) (?P<structured_data>(\[.+\])|-) (?P<msg>.+)$'
        )

    def parse(self, raw_data: str, tenant_id: str) -> Optional[SentinelXEvent]:
        match = self.rfc5424_regex.match(raw_data)
        if not match:
            return None
        
        data = match.groupdict()
        
        # Convert Syslog Priority to Severity
        pri = int(data["pri"])
        severity_map = {
            0: ("critical", 100), # Emergency
            1: ("critical", 90),  # Alert
            2: ("critical", 80),  # Critical
            3: ("high", 70),      # Error
            4: ("medium", 50),    # Warning
            5: ("low", 30),       # Notice
            6: ("low", 10),       # Info
            7: ("low", 0),        # Debug
        }
        severity, score = severity_map.get(pri // 8, ("medium", 50))

        return SentinelXEvent(
            tenant_id=tenant_id,
            timestamp=data["timestamp"],
            event_type="syslog",
            event_category="infrastructure",
            severity=severity,
            severity_score=score,
            source=data["hostname"],
            source_type="syslog_rfc5424",
            host_name=data["hostname"],
            raw=raw_data,
            normalized={
                "app_name": data["app_name"],
                "procid": data["procid"],
                "msgid": data["msgid"],
                "message": data["msg"]
            }
        )

    @property
    def source_type(self) -> str:
        return "syslog"
