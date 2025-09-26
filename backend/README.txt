
Add to app/main.py:
    from app.routers import mfa
    app.include_router(mfa.router, prefix="/users/mfa", tags=["mfa"])

Install backend deps:
    pip install -r backend/requirements.txt

Create migration (or integrate 0003_mfa.py with proper down_revision) then:
    alembic upgrade head
