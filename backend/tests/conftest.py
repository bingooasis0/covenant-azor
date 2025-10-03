# backend/tests/conftest.py
import os
import asyncio
import pytest
from httpx import AsyncClient
from asgi_lifespan import LifespanManager
from app.main import app

# Expect CI to provide DATABASE_URL and run alembic upgrade before tests.
# JWT/Redis/CORS also come from env in CI.
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_client():
    async with LifespanManager(app):
        async with AsyncClient(app=app, base_url="http://testserver") as ac:
            yield ac

@pytest.fixture(scope="session")
def admin_seed():
    # CI should pre-seed an admin or we log in with a known seeded user created by a migration/seed script.
    # For now, read from env for flexibility.
    return {
        "email": os.getenv("TEST_ADMIN_EMAIL", "admin@test.local"),
        "password": os.getenv("TEST_ADMIN_PASSWORD", "Admin#Passw0rd#2025#SetMeNow")
    }
