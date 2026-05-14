from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog
import httpx
from starlette.requests import Request
from starlette.responses import StreamingResponse

logger = structlog.get_logger()

app = FastAPI(title="SentinelX API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, restrict this to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Mapping
# Since this is a gateway, we proxy requests to internal services.
# Note: In a real monorepo docker setup, hostnames would be the service names (e.g. http://ingestion-service:8001)
ROUTES = {
    "/ingest": "http://localhost:8001",
    "/search": "http://localhost:8005",
    "/alerts": "http://localhost:8004",
}

client = httpx.AsyncClient()

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(request: Request, path: str):
    target_url = None
    for prefix, internal_url in ROUTES.items():
        if request.url.path.startswith(prefix):
            target_url = f"{internal_url}{request.url.path}"
            break
            
    if not target_url:
        target_url = f"http://localhost:8001{request.url.path}" # Default fallback for now
        
    logger.info(f"Proxying request to {target_url}")
    
    body = await request.body()
    
    # Forward the request
    req = client.build_request(
        request.method,
        target_url,
        headers=request.headers.raw,
        content=body,
        params=request.query_params
    )
    
    response = await client.send(req, stream=True)
    return StreamingResponse(
        response.aiter_raw(),
        status_code=response.status_code,
        headers=response.headers,
        background=response.aclose
    )
