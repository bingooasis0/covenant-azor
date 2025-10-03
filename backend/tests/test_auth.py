# backend/tests/test_auth.py
import pytest

@pytest.mark.asyncio
async def test_token_success_and_me(test_client, admin_seed):
    # Login
    r = await test_client.post("/auth/token", data={
        "username": admin_seed["email"],
        "password": admin_seed["password"]
    })
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    assert tok

    # /users/me
    r2 = await test_client.get("/users/me", headers={"Authorization": f"Bearer {tok}"})
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["email"] == admin_seed["email"]

@pytest.mark.asyncio
async def test_token_invalid_password(test_client, admin_seed):
    r = await test_client.post("/auth/token", data={
        "username": admin_seed["email"],
        "password": "wrong-password-xxxx"
    })
    assert r.status_code == 400
