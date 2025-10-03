# backend/tests/test_admin_users.py
import pytest

async def _login(client, email, pwd):
    r = await client.post("/auth/token", data={"username": email, "password": pwd})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]

@pytest.mark.asyncio
async def test_admin_users_crud_flow(test_client, admin_seed):
    tok = await _login(test_client, admin_seed["email"], admin_seed["password"])
    h = {"Authorization": f"Bearer {tok}"}

    # Create
    payload = {
        "email": "user1@test.local",
        "first_name": "User",
        "last_name": "One",
        "role": "AZOR",
        "password": "ThisIsALongTempPass#2025"
    }
    r = await test_client.post("/admin/users", json=payload, headers=h)
    assert r.status_code == 200, r.text
    uid = r.json()["id"]

    # List
    r = await test_client.get("/admin/users", headers=h)
    assert r.status_code == 200
    assert any(u["id"] == uid for u in r.json())

    # Update role
    r = await test_client.patch(f"/admin/users/{uid}", json={"role":"COVENANT"}, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["role"] == "COVENANT"

    # Reset password (bcrypt)
    r = await test_client.post(f"/admin/users/{uid}/reset-password", json={"new_password":"New#Strong#Passw0rd!"}, headers=h)
    assert r.status_code == 200

    # Reset MFA
    r = await test_client.post(f"/admin/users/{uid}/mfa/reset", headers=h)
    assert r.status_code == 200

    # Delete (no referrals; should succeed)
    r = await test_client.delete(f"/admin/users/{uid}", headers=h)
    assert r.status_code == 200
