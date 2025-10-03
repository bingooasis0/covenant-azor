import os
import time
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

try:
    import redis.asyncio as redis  # redis>=4.2
except Exception:
    redis = None

# ---------- ENV / Config ----------
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW_SECS", "60"))
PREFIX = os.getenv("RATE_LIMIT_PREFIX", "rl:")
AUTH_PER_MIN = int(os.getenv("RATE_LIMIT_AUTH_PER_MIN", "10"))
WRITE_PER_MIN = int(os.getenv("RATE_LIMIT_WRITE_PER_MIN", "60"))
READ_PER_MIN = int(os.getenv("RATE_LIMIT_READ_PER_MIN", "120"))
REDIS_URL = os.getenv("REDIS_URL", "")

# Relaxed / bypass lists (comma-separated)
_env_bypass = {
    s.strip() for s in os.environ.get("RATE_LIMIT_BYPASS_ROUTES", "").split(",") if s.strip()
}
_env_relaxed = {
    s.strip() for s in os.environ.get("RATE_LIMIT_RELAXED_ROUTES", "").split(",") if s.strip()
}
# Sensible defaults so MFA flows don’t get throttled to death in dev
DEFAULT_BYPASS = {"/users/mfa/qrcode"}
DEFAULT_RELAXED = {"/users/mfa/setup", "/users/mfa/verify"}

BYPASS_ROUTES = _env_bypass.union(DEFAULT_BYPASS)
RELAXED_ROUTES = _env_relaxed.union(DEFAULT_RELAXED)
RELAXED_WRITE_PER_MIN = int(os.environ.get("RATE_LIMIT_RELAXED_WRITE_PER_MIN", "300"))

# ---------- Helpers ----------
def classify(request: Request) -> int:
    """Return the normal per-minute limit for this request."""
    path = (request.url.path or "").lower()
    method = (request.method or "").upper()
    if path == "/auth/token":
        return AUTH_PER_MIN
    if method in ("POST", "PATCH", "DELETE"):
        return WRITE_PER_MIN
    return READ_PER_MIN


class InProcBucket:
    """Very simple per-process fallback counter."""
    def __init__(self):
        self.store = {}

    def incr(self, key: str, ttl: int) -> int:
        now = int(time.time())
        bucket = self.store.get(key)
        if not bucket or bucket["exp"] <= now:
            bucket = {"count": 0, "exp": now + ttl}
        bucket["count"] += 1
        self.store[key] = bucket
        return bucket["count"]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.r: Optional["redis.Redis"] = None
        self.inproc = InProcBucket()

    async def _redis_incr(self, key: str, ttl: int) -> int:
        # Lazy init Redis if configured
        if REDIS_URL and redis:
            if not self.r:
                ssl = REDIS_URL.startswith("rediss://")
                # Let system trust store handle certs; tighten later if you provide a CA
                self.r = redis.from_url(REDIS_URL, ssl=ssl)
            try:
                pipe = self.r.pipeline()
                pipe.incr(key, 1)
                pipe.expire(key, ttl)
                count, _ = await pipe.execute()
                return int(count)
            except Exception:
                # fall through to in-proc on any Redis trouble
                pass
        return self.inproc.incr(key, ttl)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        ip = request.client.host if request.client else "unknown"

        # Bypass some routes entirely (e.g., QR image)
        if path in BYPASS_ROUTES or path.startswith("/users/mfa/qrcode"):
            return await call_next(request)

        # Relax MFA setup / verify; also allow env-specified relaxed routes
        if path in RELAXED_ROUTES or path.startswith("/users/mfa/"):
            limit = RELAXED_WRITE_PER_MIN
            bucket_tag = "relaxed"
        else:
            limit = classify(request)
            bucket_tag = "norm"

        ttl = RATE_LIMIT_WINDOW
        window_bucket = int(time.time() // ttl)
        key = f"{PREFIX}{bucket_tag}:{ip}:{path}:{window_bucket}"

        count = await self._redis_incr(key, ttl)
        if count > limit:
            return JSONResponse(
                {"code": "rate_limited", "message": "Too many requests"},
                status_code=429,
            )

        return await call_next(request)
