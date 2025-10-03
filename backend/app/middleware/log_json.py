from __future__ import annotations
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import json, time, uuid, logging

logger = logging.getLogger("app.log_json")

class LogJSONMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        try:
            response: Response = await call_next(request)
            logger.info(json.dumps({
                "type": "access","request_id": req_id,"method": request.method,"path": request.url.path,
                "status": response.status_code,"duration_ms": int((time.time()-start)*1000),
                "client_ip": request.client.host if request.client else None,
            }))
            return response
        except Exception as ex:  # pragma: no cover
            logger.error(json.dumps({"type": "error","request_id": req_id,"path": request.url.path,"message": str(ex)}))
            raise
