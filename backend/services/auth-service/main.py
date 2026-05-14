from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import structlog
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from backend.shared.config import settings

logger = structlog.get_logger()
app = FastAPI(title="SentinelX Auth Service")
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    user: dict

class InviteUserRequest(BaseModel):
    email: str
    role: str = "analyst"

class RoleUpdateRequest(BaseModel):
    role: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        org_id = payload.get("org_id")
        role = payload.get("role")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "org_id": org_id, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")

def require_role(*roles: str):
    async def checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker

@app.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user via Supabase Auth (or internal DB).
    In production, delegate to Supabase Python client:
      supabase.auth.sign_in_with_password({"email": ..., "password": ...})
    """
    # MOCK: Replace with real Supabase auth call
    if request.email == "admin@sentinelx.io" and request.password == "admin":
        user_id = str(uuid.uuid4())
        org_id = str(uuid.uuid4())
        token = create_access_token({
            "sub": user_id,
            "org_id": org_id,
            "role": "org_admin",
            "email": request.email
        })
        return TokenResponse(
            access_token=token,
            user={
                "id": user_id,
                "email": request.email,
                "role": "org_admin",
                "org_id": org_id
            }
        )
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Issue a fresh token for the current user."""
    new_token = create_access_token(current_user)
    return {"access_token": new_token, "token_type": "bearer"}

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # In production: supabase.auth.sign_out()
    return {"message": "Logged out successfully"}

@app.get("/users")
async def list_users(current_user: dict = Depends(require_role("super_admin", "org_admin"))):
    # In production: query Supabase `users` table filtered by org_id
    return {"users": [], "org_id": current_user["org_id"]}

@app.post("/users/invite")
async def invite_user(
    request: InviteUserRequest,
    current_user: dict = Depends(require_role("super_admin", "org_admin"))
):
    # In production: supabase.auth.admin.invite_user_by_email(request.email)
    return {"message": f"Invitation sent to {request.email}", "role": request.role}

@app.get("/api-keys")
async def list_api_keys(current_user: dict = Depends(get_current_user)):
    return {"api_keys": [], "org_id": current_user["org_id"]}

@app.post("/api-keys")
async def create_api_key(name: str, current_user: dict = Depends(get_current_user)):
    import secrets, hashlib
    raw_key = f"sx_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    # In production: write to Supabase `api_keys`
    return {"key": raw_key, "key_id": str(uuid.uuid4()), "name": name}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth-service"}
