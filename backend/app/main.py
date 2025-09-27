from app.routers import mfa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, me, users, referrals, admin, audit, metrics, support

app = FastAPI(title="Covenant Azor Backend")
app.include_router(mfa.router, prefix="/users/mfa", tags=["mfa"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",    tags=["auth"])
app.include_router(me.router,       prefix="/users",   tags=["users"])
app.include_router(users.router,    prefix="/users",   tags=["users-admin"])
app.include_router(referrals.router,prefix="/referrals", tags=["referrals"])
app.include_router(admin.router,    prefix="/admin",   tags=["admin"])
app.include_router(audit.router,    prefix="/audit",   tags=["audit"])
app.include_router(metrics.router,  prefix="/metrics", tags=["metrics"])
app.include_router(support.router,  prefix="/support", tags=["support"])
