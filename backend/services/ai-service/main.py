from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import structlog
import asyncio
import json
import redis.asyncio as aioredis
from backend.shared.config import settings

logger = structlog.get_logger()
app = FastAPI(title="SentinelX AI Service")
security = HTTPBearer()

class AlertSummaryRequest(BaseModel):
    alert_id: str
    alert_title: str
    alert_severity: str
    source_events: list[dict] = []
    mitre_tactics: list[str] = []

class NLSearchRequest(BaseModel):
    query: str   # e.g., "Show failed VPN logins from India in the last 6 hours"
    tenant_id: str

class ThreatAnalysisRequest(BaseModel):
    incident_id: str
    alert_ids: list[str]
    notes: str = ""

class AIResponse(BaseModel):
    request_id: str
    status: str = "queued"
    result: Optional[str] = None

async def call_llm(prompt: str, system: str = "") -> str:
    """
    Call an OpenAI-compatible LLM API.
    Swappable: OpenAI, Gemini, Ollama, Azure OpenAI.
    """
    try:
        import httpx
        payload = {
            "model": settings.OPENAI_MODEL if hasattr(settings, 'OPENAI_MODEL') else "gpt-4o",
            "messages": [
                {"role": "system", "content": system or "You are SentinelX, an expert cybersecurity analyst AI."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1024
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {getattr(settings, 'OPENAI_API_KEY', '')}"},
                json=payload
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return f"[AI service temporarily unavailable: {str(e)}]"

@app.post("/ai/alert-summary", response_model=AIResponse)
async def alert_summary(request: AlertSummaryRequest, background_tasks: BackgroundTasks):
    """Generate an AI-powered summary of an alert."""
    import uuid
    request_id = str(uuid.uuid4())

    prompt = f"""
Analyze the following SIEM alert and provide a concise, actionable summary for a SOC analyst:

Alert Title: {request.alert_title}
Severity: {request.alert_severity}
MITRE Tactics: {', '.join(request.mitre_tactics)}
Number of Source Events: {len(request.source_events)}
Sample Events: {json.dumps(request.source_events[:3], indent=2)}

Provide:
1. What happened (2 sentences)
2. Potential impact (1 sentence)  
3. Recommended immediate actions (3 bullet points)
4. Relevant threat actor TTPs if applicable
"""
    background_tasks.add_task(_process_ai_request, request_id, prompt)
    return AIResponse(request_id=request_id, status="queued")

@app.post("/ai/search", response_model=AIResponse)
async def natural_language_search(request: NLSearchRequest, background_tasks: BackgroundTasks):
    """Convert natural language query to SentinelX SIEM search syntax."""
    import uuid
    request_id = str(uuid.uuid4())

    prompt = f"""
Convert this natural language security query into SentinelX SIEM search syntax.

SIEM Syntax Reference:
- field=value  (exact match)
- field~value  (contains)
- field>N      (greater than, numeric)
- AND / OR / NOT operators
- timestamp>now-6h  (time ranges)

Natural language query: "{request.query}"

Return ONLY the translated query string. No explanation.
"""
    background_tasks.add_task(_process_ai_request, request_id, prompt)
    return AIResponse(request_id=request_id, status="queued")

@app.post("/ai/threat-analysis", response_model=AIResponse)
async def threat_analysis(request: ThreatAnalysisRequest, background_tasks: BackgroundTasks):
    """Perform a comprehensive AI threat analysis for an incident."""
    import uuid
    request_id = str(uuid.uuid4())

    prompt = f"""
Perform a comprehensive threat analysis for this security incident:

Incident ID: {request.incident_id}
Linked Alerts: {len(request.alert_ids)}
Analyst Notes: {request.notes or 'None'}

Provide:
1. Attack narrative (paragraph)
2. MITRE ATT&CK mapping (techniques and sub-techniques)
3. Threat actor attribution hypothesis (if patterns match known groups)
4. Evidence gaps (what data we're missing)
5. Remediation roadmap (prioritized steps)
"""
    background_tasks.add_task(_process_ai_request, request_id, prompt)
    return AIResponse(request_id=request_id, status="queued")

async def _process_ai_request(request_id: str, prompt: str):
    """Background task: call LLM and store result in Redis."""
    try:
        result = await call_llm(prompt)
        # Store result in Redis for 1 hour
        r = aioredis.from_url(settings.REDIS_URL)
        await r.setex(f"ai:result:{request_id}", 3600, json.dumps({"status": "done", "result": result}))
        await r.aclose()
    except Exception as e:
        logger.error(f"AI background task failed: {e}")

@app.get("/ai/result/{request_id}")
async def get_ai_result(request_id: str):
    """Poll for AI result."""
    r = aioredis.from_url(settings.REDIS_URL)
    raw = await r.get(f"ai:result:{request_id}")
    await r.aclose()
    if not raw:
        return {"status": "pending", "request_id": request_id}
    data = json.loads(raw)
    return {"status": data["status"], "request_id": request_id, "result": data.get("result")}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service"}
