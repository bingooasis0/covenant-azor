Covenant Azor – Referral & User Management Platform

Covenant Azor is a SaaS platform for managing referrals, users, announcements, and audit events.
It is built with FastAPI + PostgreSQL (backend) and Next.js + React (frontend).

The system enforces role-based access:

COVENANT (Admin) → Can manage all referrals, users, and announcements.

AZOR (Agent) → Can view and manage only their own referrals.

🔧 Quick Start
Backend (FastAPI + PostgreSQL)
# From repo root
cd backend

# Activate venv
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start DB (Docker)
docker compose up -d covenant_azor_db

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


Backend will be available at:
👉 http://127.0.0.1:8000

Health check:
👉 http://127.0.0.1:8000/docs
 (OpenAPI UI)

Frontend (Next.js 14)
cd frontend

# Install deps
npm install

# Create .env.local
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000

# Run dev server
npm run dev


Frontend will be available at:
👉 http://localhost:3000

⚙️ Environment Matrix
Service	Port	Env Variable	Default Example
Backend	8000	DATABASE_URL	postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor
Frontend	3000	NEXT_PUBLIC_API_BASE	http://127.0.0.1:8000
PostgreSQL	5434	POSTGRES_USER	azor
		POSTGRES_PASSWORD	Admin#DbPass#2025 (percent-encode # in DATABASE_URL → %23)
		POSTGRES_DB	azor
📑 API Endpoints
Auth

POST /auth/token → Login, returns access_token + role

GET /users/me → Current user info

Referrals

GET /referrals/my → Agent’s referrals

GET /admin/referrals → All referrals (admin only)

POST /referrals → Create referral (agent)

POST /admin/referrals → Create referral with explicit agent_id (admin)

PATCH /admin/referrals/{id} → Update referral

DELETE /admin/referrals/{id} → Delete referral

GET /referrals/{id}/files → List uploaded files

POST /referrals/{id}/files → Upload

DELETE /referrals/{id}/files/{file_id} → Delete

Users

GET /admin/users → List users

PATCH /admin/users/{id} → Update name/role

POST /admin/users → Create new user

DELETE /admin/users/{id} → Delete (blocked if user has referrals)

POST /admin/users/{id}/reset-password → Reset password (bcrypt hash)

POST /admin/users/{id}/mfa/reset → Reset MFA

Audit

GET /audit/events?limit=50&offset=0 → Paginated list of audit logs (newest first)

Announcements

GET /admin/announcements → Current items

PUT /admin/announcements → Update

🛡️ Security & Reliability Practices

Password hashing: All new passwords hashed with bcrypt. Old Argon2 hashes remain valid until rotated.

JWTs: HS256 only. No algorithm fallback. Secret stored in .env.

Roles enforced: Admin endpoints (/admin/*) require COVENANT role. Agent endpoints restricted.

User deletion: Block if referrals exist. Must reassign before delete.

DB resilience: JSONB columns for flexible fields (opportunity_types, locations, environment).

🔒 Incident Playbook
Rotate JWT Secret

Update .env with new JWT_SECRET_KEY.

Restart backend (uvicorn).

All old tokens become invalid.

Notify users to sign in again.

Revoke All Tokens

Rotate JWT secret as above.

Reset Admin Password
docker exec -it covenant_azor_db psql -U azor -d azor
UPDATE users
SET password_hash = crypt('NewStrongPassw0rd!', gen_salt('bf'))
WHERE email = 'admin@example.com';

Database Backup
docker exec covenant_azor_db pg_dump -U azor azor > backup.sql

Database Restore
cat backup.sql | docker exec -i covenant_azor_db psql -U azor -d azor

🔍 Health Checks

Backend:

GET /auth/token → must return 200 on valid creds.

GET /users/me → must return current user JSON.

GET /audit/events?limit=1&offset=0 → must return array.

Frontend:

Visit http://localhost:3000/login
 → login with known credentials.

Dashboard must render referrals, announcements, audit logs.

📞 Support Contacts

Primary Developer: Colby West

Email: support@overmnd.com

Escalation: Rotate JWT secret + lock DB at infra level if breach suspected.

⚠️ Best Practice: Keep this README updated every time you add an API route, env var, or migration.