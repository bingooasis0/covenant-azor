# backend/app/middleware/csp.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import os

# Set CSP and HSTS only when enabled
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        if os.getenv("ENABLE_CSP","false").lower() in ("1","true","yes","on"):
            # Minimal conservative CSP; adjust as needed
            response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'"
        if os.getenv("ENABLE_HSTS","false").lower() in ("1","true","yes","on"):
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response
