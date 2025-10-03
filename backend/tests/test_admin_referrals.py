# backend/tests/test_admin_referrals.py
import pytest

async def _login(client, email, pwd):
    r = await client.post("/auth/token", data={"username": email, "password": pwd})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]

@pytest.mark.asyncio
async def test_admin_referrals_crud_pagination(test_client, admin_seed):
    tok = await _login(test_client, admin_seed["email"], admin_seed["password"])
    h = {"Authorization": f"Bearer {tok}"}

    # Create an AZOR agent to own referrals
    agent_req = {
        "email": "agent1@test.local",
        "first_name": "Agent",
        "last_name": "One",
        "role": "AZOR",
        "password": "Agent#Passw0rd#2025"
    }
    r = await test_client.post("/admin/users", json=agent_req, headers=h)
    assert r.status_code == 200, r.text
    agent_id = r.json()["id"]

    # Create referrals
    created_ids = []
    for i in range(3):
        ref_req = {"agent_id": agent_id, "company": f"Acme {i}", "status": "New"}
        r = await test_client.post("/admin/referrals", json=ref_req, headers=h)
        assert r.status_code == 200, r.text
        created_ids.append(r.json()["id"])

    # List with pagination
    r = await test_client.get("/admin/referrals?limit=2&offset=0", headers=h)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "items" in data and "total" in data
    assert len(data["items"]) <= 2
    assert data["total"] >= 3

    # Update one referral
    rid = created_ids[0]
    r = await test_client.patch(f"/admin/referrals/{rid}", json={"status":"Qualified","notes":"Updated"}, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "Qualified"

    # Get single
    r = await test_client.get(f"/admin/referrals/{rid}", headers=h)
    assert r.status_code == 200

    # Delete all created
    for rid in created_ids:
        r = await test_client.delete(f"/admin/referrals/{rid}", headers=h)
        assert r.status_code == 200

    # Cleanup agent: should delete now (no referrals)
    r = await test_client.delete(f"/admin/users/{agent_id}", headers=h)
    assert r.status_code == 200
