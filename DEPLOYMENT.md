# Ubuntu Server Deployment Guide

## Production Configuration Summary

**Domain**: `partner.covenanttechnology.net`
**Database User**: `covenant`
**Database Password**: `G4TtLtcjrqQxnJGoMJh6FYiovxTyQF4Q-txK!uvZUm!NFb@hRE`

---

## Prerequisites

1. Ubuntu Server 20.04+ with root/sudo access
2. Domain DNS pointing to server IP
3. SSL certificate for `partner.covenanttechnology.net` (Let's Encrypt recommended)

---

## Step 1: Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group (replace 'ubuntu' with your username)
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

---

## Step 2: Clone & Configure Application

```bash
# Clone repository (replace with your repo URL)
git clone <your-repo-url> covenant-azor
cd covenant-azor

# Create production environment file for backend
cat > backend/.env.production << 'EOF'
DATABASE_URL=postgresql+psycopg2://covenant:G4TtLtcjrqQxnJGoMJh6FYiovxTyQF4Q-txK!uvZUm!NFb@hRE@postgres:5432/azor
FRONTEND_ORIGIN=https://partner.covenanttechnology.net
REQUIRE_MFA=true
MFA_ISSUER=Azor
MFA_BOOTSTRAP_ALLOW=False
JWT_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING
JWT_ALGORITHM=HS256
JWT_TTL_MIN=30
REDIS_URL=redis://redis:6379/0
RATE_LIMIT_WINDOW_SECS=60
RATE_LIMIT_PREFIX=rl:
RATE_LIMIT_AUTH_PER_MIN=10
RATE_LIMIT_WRITE_PER_MIN=60
RATE_LIMIT_READ_PER_MIN=120
ENABLE_CSP=true
ENABLE_HSTS=true
COOKIE_DOMAIN=partner.covenanttechnology.net
COOKIE_SECURE=true
COOKIE_SAMESITE=Lax
AUTH_COOKIE_NAME=azor_access
VIRUSTOTAL_API_KEY=5d212bcefabc2d53b6ef02fefa5dfae60c4ace794b57751354f7901178c80eb4
MS_GRAPH_CLIENT_ID=0f854af9-eda5-48b5-b818-b19fc55421fb
MS_GRAPH_TENANT_ID=9a30eba2-2bf7-4e9d-ab1c-0382a965e31e
MS_GRAPH_SENDER=noreply@covenanttechnology.net
EOF

# Frontend environment is already configured in .env.production
```

---

## Step 3: Update Docker Compose Configuration

The `deploy/docker-compose.yml` file has been pre-configured with:
- Database credentials (user: covenant)
- Production domain (partner.covenanttechnology.net)
- HTTPS cookie settings
- CORS origin settings

**⚠️ IMPORTANT**: Update these placeholders in `deploy/docker-compose.yml`:
- Line 21: Replace `ghcr.io/OWNER/REPO-backend:latest` with your backend image
- Line 46: Replace `ghcr.io/OWNER/REPO-frontend:latest` with your frontend image
- Line 28: Replace `JWT_SECRET: change-me-please` with a secure random string

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

---

## Step 4: Build Docker Images

```bash
# Build backend image
docker build -f backend/Dockerfile -t covenant-azor-backend:latest .

# Build frontend image
docker build -f frontend/Dockerfile -t covenant-azor-frontend:latest .
```

---

## Step 5: Setup Nginx Reverse Proxy with SSL

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/partner.covenanttechnology.net << 'EOF'
server {
    listen 80;
    server_name partner.covenanttechnology.net;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name partner.covenanttechnology.net;

    # SSL certificates (will be added by certbot)

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/partner.covenanttechnology.net /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Obtain SSL certificate
sudo certbot --nginx -d partner.covenanttechnology.net

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 6: Deploy Application

```bash
# Navigate to deploy directory
cd deploy

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify services are running
docker-compose ps
```

---

## Step 7: Initialize Database

```bash
# Run Alembic migrations
docker-compose exec backend alembic upgrade head

# Create initial admin user (if needed)
docker-compose exec backend python scripts/seed_admin.py
```

---

## Step 8: Verify Deployment

1. Visit `https://partner.covenanttechnology.net`
2. Check SSL certificate is valid
3. Test login functionality
4. Verify MFA enrollment works
5. Test creating a referral

---

## Production Checklist

- [x] Database credentials updated to production values
- [x] Domain configured to `partner.covenanttechnology.net`
- [x] HTTPS enabled with secure cookies
- [x] CORS configured for production domain
- [x] Docker images build successfully
- [x] All TypeScript errors resolved
- [x] Unused files removed
- [ ] JWT_SECRET changed to secure random value
- [ ] Docker image registry configured (ghcr.io)
- [ ] SSL certificate obtained via Let's Encrypt
- [ ] Database backups configured
- [ ] Monitoring/logging setup (optional)

---

## Maintenance Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend
docker-compose restart frontend

# Update application
git pull
docker-compose down
docker build -f backend/Dockerfile -t covenant-azor-backend:latest .
docker build -f frontend/Dockerfile -t covenant-azor-frontend:latest .
docker-compose up -d

# Backup database
docker-compose exec postgres pg_dump -U covenant azor > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_YYYYMMDD.sql | docker-compose exec -T postgres psql -U covenant azor
```

---

## Troubleshooting

### Frontend can't reach backend
- Check `NEXT_PUBLIC_API_BASE` in frontend/.env.production
- Verify Nginx reverse proxy configuration
- Check CORS settings in backend

### Database connection errors
- Verify DATABASE_URL in backend environment
- Check PostgreSQL container is running: `docker-compose ps`
- Verify database credentials match

### Cookie/Session issues
- Ensure `COOKIE_SECURE=true` for HTTPS
- Verify `COOKIE_DOMAIN=partner.covenanttechnology.net`
- Check browser dev tools for cookie errors

### Build failures
- Clear Next.js cache: `rm -rf frontend/.next`
- Rebuild images with `--no-cache` flag
- Check Node.js version (requires 20+)

---

## Security Notes

1. **Change JWT_SECRET** - The default value must be replaced with a cryptographically secure random string
2. **MFA_BOOTSTRAP_ALLOW** - Set to `False` in production after initial admin setup
3. **Database credentials** - Already configured with strong password
4. **Firewall** - Configure UFW to only allow ports 80, 443, and SSH
5. **Regular updates** - Keep Docker images and system packages updated

```bash
# Enable firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
