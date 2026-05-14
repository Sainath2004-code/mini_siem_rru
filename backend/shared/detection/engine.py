import asyncio
import json
import time
from typing import List, Dict, Any
import structlog
from backend.shared.cache.redis_client import redis_client
from backend.shared.models.events import SentinelXEvent

logger = structlog.get_logger()

class DetectionEngine:
    async def evaluate_threshold_rule(self, event: dict, rule: dict) -> bool:
        """
        Evaluates a threshold-based rule using Redis sliding windows.
        Example rule: count(login_failure) > 10 in 5m
        """
        tenant_id = event.get("tenant_id")
        rule_id = rule.get("id")
        window_sec = rule.get("window_sec", 300)
        threshold = rule.get("threshold", 10)
        
        # Unique key for this tenant + rule + unique identifier (e.g., user_name or source_ip)
        # For now, we group by tenant + rule
        key = f"detection:threshold:{tenant_id}:{rule_id}"
        
        # Use Redis sorted set for sliding window
        now = time.time()
        pipeline = redis_client.pipeline()
        
        # 1. Add current event
        pipeline.zadd(key, {str(now): now})
        # 2. Remove old events outside window
        pipeline.zremrangebyscore(key, 0, now - window_sec)
        # 3. Count events in window
        pipeline.zcard(key)
        # 4. Set TTL on key
        pipeline.expire(key, window_sec)
        
        results = await pipeline.execute()
        count = results[2]
        
        if count >= threshold:
            logger.info("Threshold rule triggered", rule_id=rule_id, count=count, threshold=threshold)
            return True
        
        return False

    def evaluate_simple_rule(self, event: dict, rule: dict) -> bool:
        """Evaluates simple boolean conditions."""
        condition = rule.get("condition", {})
        for field, value in condition.items():
            if event.get(field) != value:
                return False
        return True

# Singleton
detection_engine = DetectionEngine()
