from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jose.jwt as jwt
from backend.shared.config import settings
import structlog

logger = structlog.get_logger()
security = HTTPBearer()

class TenantMiddleware:
    def __init__(self):
        self.secret = settings.JWT_SECRET
        self.algorithm = "HS256"

    async def __call__(self, request: Request):
        """Middleware to enforce tenant isolation via JWT."""
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            # Allow health checks and public endpoints if needed
            if request.url.path in ["/health", "/metrics"]:
                return
            raise HTTPException(status_code=401, detail="Authentication required")
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            
            tenant_id = payload.get("org_id")
            user_id = payload.get("sub")
            
            if not tenant_id:
                raise HTTPException(status_code=403, detail="Tenant context missing in token")
            
            # Inject into request state for easy access
            request.state.tenant_id = tenant_id
            request.state.user_id = user_id
            
        except Exception as e:
            logger.error("JWT validation failed", error=str(e))
            raise HTTPException(status_code=401, detail="Invalid or expired token")

tenant_guard = TenantMiddleware()
