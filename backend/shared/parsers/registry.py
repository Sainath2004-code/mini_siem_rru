from typing import Dict, Type, Optional
from backend.shared.parsers.base import BaseParser
import structlog

logger = structlog.get_logger()

class ParserRegistry:
    def __init__(self):
        self._parsers: Dict[str, BaseParser] = {}

    def register(self, parser: BaseParser):
        self._parsers[parser.name] = parser
        logger.info("Registered parser", parser_name=parser.name, source_type=parser.source_type)

    def get_parser(self, name: str) -> Optional[BaseParser]:
        return self._parsers.get(name)

    def get_parser_for_source(self, source_type: str) -> Optional[BaseParser]:
        """Finds the first parser matching the source type."""
        for parser in self._parsers.values():
            if parser.source_type == source_type:
                return parser
        return None

# Singleton instance
parser_registry = ParserRegistry()
