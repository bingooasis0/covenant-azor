Covenant Azor – Documentation & Runbook

Overview
Covenant Azor is a SaaS platform for managing referrals, users, announcements, and audit logs.
Frontend: Next.js 14 + React + Tailwind (frontend/)
Backend: FastAPI + SQLAlchemy + Alembic migrations (backend/)
Database: PostgreSQL 16 (Docker container covenant_azor_db)
Authentication: JWT (PyJWT), short TTL, bearer tokens

Roles:
COVENANT: Admin (full access, manages users/referrals/announcements/audit)
AZOR: Agent/Partner (limited, sees only their own referrals)
Persistence: Bcrypt password hashing, audit events on all key actions
Isolation: Single tenant for now, code structured to support multi-tenant later

Environment Matrix
Env	URL/API Base	Database URL (example)	Notes
Dev	http://127.0.0.1:8000	postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor	Run via Docker Compose + uvicorn reload
Staging	https://staging.azor.app	postgresql+psycopg2://azor:<secure>@staging-db.internal:5432/azor	Locked CORS; staging SMTP + Stripe sandbox
Production	https://azor.app	postgresql+psycopg2://azor:<secure>@prod-db.internal:5432/azor	TLS only, backups + retention, alerts
Run Commands
Backend
# From backend/
.venv/Scripts/uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload

Database
# Show containers
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"

# Inspect Postgres mapping
docker inspect covenant_azor_db --format '{{json .NetworkSettings.Ports}}' | jq .

# Connect inside container
docker exec -it covenant_azor_db psql -U azor -d azor

Frontend
# From frontend/
npm run dev     # Next.js dev server (http://localhost:3000)
Health Endpoints
GET /health → {status: "ok"}
GET /users/me → verify JWT decoding + DB access
GET /audit/events?limit=1&offset=0 → verify audit pipeline
DB check: select now();
Incident Playbook

1. Rotate JWT Secret
Update JWT_SECRET in .env (staging/prod).
Restart backend pods/containers.
All existing tokens become invalid. Users must re-login.

2. Revoke User Tokens
Currently tokens are short-lived; no live revocation store.

Mitigation:
Rotate JWT secret (kills all tokens).
For targeted user lockout: change password → old token expires at next verification.

3. Reset Admin Password
# From backend container or host
docker exec -it covenant_azor_db psql -U azor -d azor \
  -c "UPDATE users SET password_hash = crypt('NewStrongPassw0rd!', gen_salt('bf')) WHERE email='admin@domain.com';"

Then login with the new password.

4. Database Backup & Restore
Backup (daily, cron or managed service):
docker exec covenant_azor_db pg_dump -U azor azor > backup_$(date +%F).sql

Restore:
docker exec -i covenant_azor_db psql -U azor -d azor < backup_file.sql

5. File Upload Incident
Validate suspicious uploads → check referrals/{id}/files.
Delete from DB + storage if malicious.
Consider AV scan integration.

Support Contacts
Engineering: colby@covenanttechnology.net
Ops/On-call: support@covenanttechnology.net
Security: colby@covenanttechnology.net
Client Support: support@overmnd.com

Next Steps (Pre-Production)
Finish /admin/referrals CRUD with pagination
Ensure bcrypt on all password reset flows
Migrate tokens to HttpOnly cookies
Lock CORS to exact frontend domains
Add structured logging + monitoring
Write pytest suite for auth/users/referrals/audit

⚠️ Rule of thumb: if login works but data 401s, check role in /users/me, confirm the page calls the right endpoint (/admin/referrals vs /referrals/my), and confirm Authorization headers are attached.