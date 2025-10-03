from __future__ import annotations

from typing import Callable
from fastapi import Request
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from .config import Settings


def add_security_middleware(app, settings: Settings) -> None:
    """
    Install strict CORS, CSP/HSTS/security headers, and (optionally) disable Authorization header in prod.
    """
    # Strict, exact-match CORS (no wildcards), credentials allowed
    if getattr(app, "user_middleware", None) is not None:
        # Avoid duplicate install in hot-reload scenarios
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.CORS_ORIGINS or [],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            # Authorization is allowed in dev; prod rejection handled by RejectAuthHeaderInProd
            allow_headers=["Content-Type", "X-Requested-With", "Authorization"],
            expose_headers=[],
            max_age=600,
        )

        # Security headers (CSP, HSTS, etc.)
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)

        # Reject Authorization header in production to enforce cookie-only auth
        if settings.is_prod and settings.DISABLE_AUTH_HEADER_IN_PROD:
            app.add_middleware(RejectAuthHeaderInProd, settings=settings)


class RejectAuthHeaderInProd(BaseHTTPMiddleware):
    def __init__(self, app, settings: Settings):
        super().__init__(app)
        self.settings = settings

    async def dispatch(self, request: Request, call_next: Callable):
        if request.headers.get("authorization"):
            return JSONResponse(
                status_code=401,
                content={
                    "code": "header_auth_disabled",
                    "message": "Authorization header is disabled in production. Use cookie-based authentication.",
                },
            )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, settings: Settings):
        super().__init__(app)
        self.s = settings

    def _build_csp(self) -> str:
        csp_parts = [
            f"default-src {self.s.CSP_DEFAULT_SRC}",
            f"img-src {self.s.CSP_IMG_SRC}",
            f"script-src {self.s.CSP_SCRIPT_SRC}",
            f"style-src {self.s.CSP_STYLE_SRC}",
            f"connect-src {self.s.CSP_CONNECT_SRC}",
            f"frame-ancestors {self.s.CSP_FRAME_ANCESTORS}",
            "base-uri 'self'",
            "object-src 'none'",
        ]
        return "; ".join(csp_parts)

    async def dispatch(self, request: Request, call_next: Callable):
        response: Response = await call_next(request)

        # Content Security Policy
        response.headers.setdefault("Content-Security-Policy", self._build_csp())

        # Other security headers
        response.headers.setdefault("Referrer-Policy", self.s.REFERRER_POLICY)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")

        # HSTS only in prod over HTTPS
        if self.s.is_prod and self.s.ENABLE_HSTS:
            response.headers.setdefault(
                "Strict-Transport-Security",
                f"max-age={int(self.s.HSTS_MAX_AGE)}; includeSubDomains",
            )

        return response
