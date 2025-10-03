from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse({"code": str(exc.status_code), "message": exc.detail}, status_code=exc.status_code)

async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse({"code":"internal_error","message":"An unexpected error occurred."}, status_code=500)
