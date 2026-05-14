import redis.asyncio as redis
from backend.shared.config import settings

def get_redis_client():
    """Returns an async Redis client."""
    return redis.from_url(settings.REDIS_URL, decode_responses=True)

# Shared client instance
redis_client = get_redis_client()
