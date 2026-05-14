from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from backend.shared.models.events import SentinelXEvent

class BaseParser(ABC):
    """Abstract base class for all SentinelX log parsers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def source_type(self) -> str:
        pass

    @abstractmethod
    def parse(self, raw_data: Any, tenant_id: str) -> Optional[SentinelXEvent]:
        """
        Parses raw data into a SentinelXEvent (SCS).
        Returns None if parsing fails.
        """
        pass
