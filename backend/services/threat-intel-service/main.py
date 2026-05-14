import asyncio
import structlog
import httpx
import json
import time
from typing import List, Dict, Any
from backend.shared.cache.redis_client import redis_client
from backend.shared.config import settings

logger = structlog.get_logger()

class ThreatIntelSync:
    def __init__(self):
        self.feeds = [
            {"name": "alienvault", "url": "https://otx.alienvault.com/api/v1/indicators/export", "type": "ip"},
            # In production, we'd add more feeds like MISP, STIX/TAXII
        ]
        self.ioc_key = "intel:ioc:ip"

    async def sync_feeds(self):
        """Main loop for syncing threat intel feeds."""
        while True:
            logger.info("Starting Threat Intel sync")
            try:
                # 1. Fetch from AlienVault (example)
                # Note: In reality, you'd need an API key and proper pagination
                # For this implementation, we'll simulate the ingestion of a known list
                await self._ingest_otx_simulated()
                
                logger.info("Threat Intel sync complete")
            except Exception as e:
                logger.error("Sync failed", error=str(e))
            
            # Sync every 1 hour
            await asyncio.sleep(3600)

    async def _ingest_otx_simulated(self):
        """Simulates OTX ingestion for high-reputation malicious IPs."""
        # This list would normally come from an API
        malicious_ips = [
            "1.2.3.4", "5.6.7.8", "192.168.100.200", "8.8.8.8" # Just examples
        ]
        
        # In a real scenario, we'd fetch from httpx.get()
        # For now, we populate Redis to enable the Enrichment service
        for ip in malicious_ips:
            await redis_client.sadd(self.ioc_key, ip)
        
        # Set expiration for IOCs (e.g., 7 days)
        await redis_client.expire(self.ioc_key, 604800)

    async def lookup_ip(self, ip: str) -> Dict[str, Any]:
        """Checks if an IP is in the threat intel database."""
        is_malicious = await redis_client.sismember(self.ioc_key, ip)
        if is_malicious:
            return {
                "malicious": True,
                "confidence": 85,
                "category": "malware_distribution",
                "source": "SentinelX Aggregated Intel"
            }
        return {"malicious": False}

async def main():
    sync = ThreatIntelSync()
    logger.info("Starting Threat Intel Service")
    
    # Start background syncer
    asyncio.create_task(sync.sync_feeds())
    
    # Simple HTTP server for manual lookups
    from fastapi import FastAPI
    app = FastAPI(title="SentinelX Threat Intel Service")
    
    @app.get("/intel/lookup/{ip}")
    async def lookup(ip: str):
        return await sync.lookup_ip(ip)
    
    @app.get("/health")
    async def health():
        return {"status": "ok"}
    
    import uvicorn
    config = uvicorn.Config(app, host="0.0.0.0", port=9110)
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
