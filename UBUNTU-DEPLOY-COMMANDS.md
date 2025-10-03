# Ubuntu Server Deployment - Copy/Paste Commands

## Step 1: Install Docker & Docker Compose

SSH into your Ubuntu server and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group (replace 'ubuntu' with your username if different)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

---

## Step 2: Clone Repository & Deploy

```bash
# Clone the repository
git clone https://github.com/bingooasis0/covenant-azor.git
cd covenant-azor/deploy

# Pull the Docker images from GitHub Container Registry
docker-compose pull

# Start all services in background
docker-compose up -d

# Watch the logs (Ctrl+C to exit, services keep running)
docker-compose logs -f
```

---

## Step 3: Initialize Database

After services are running, initialize the database:

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create initial admin user (if you have a seed script)
# docker-compose exec backend python scripts/seed_admin.py
```

---

## Step 4: Verify Everything is Running

```bash
# Check all containers are up
docker-compose ps

# Should show:
# - postgres (healthy)
# - redis (running)
# - backend (running on port 8000)
# - frontend (running on port 3000)

# Test backend API
curl http://localhost:8000/api/health || curl http://localhost:8000

# Test frontend
curl http://localhost:3000
```

---

## Step 5: Setup Nginx Reverse Proxy (For HTTPS)

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/partner.covenanttechnology.net << 'EOF'
server {
    listen 80;
    server_name partner.covenanttechnology.net;

    # Redirect HTTP to HTTPS (will be configured by certbot)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name partner.covenanttechnology.net;

    # SSL certificates will be added by certbot

    client_max_body_size 50M;

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

# Enable the site
sudo ln -s /etc/nginx/sites-available/partner.covenanttechnology.net /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Obtain SSL certificate (make sure DNS points to this server first!)
sudo certbot --nginx -d partner.covenanttechnology.net --non-interactive --agree-tos --email your-email@example.com

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 6: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## Quick Reference - Common Commands

### View Logs
```bash
cd ~/covenant-azor/deploy
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
cd ~/covenant-azor/deploy
docker-compose restart backend
docker-compose restart frontend
docker-compose restart
```

### Stop Everything
```bash
cd ~/covenant-azor/deploy
docker-compose down
```

### Update Application (After Pushing New Code)
```bash
cd ~/covenant-azor
git pull
cd deploy
docker-compose pull
docker-compose up -d
```

### Database Backup
```bash
cd ~/covenant-azor/deploy
docker-compose exec postgres pg_dump -U covenant azor > ~/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
cd ~/covenant-azor/deploy
cat ~/backup_YYYYMMDD_HHMMSS.sql | docker-compose exec -T postgres psql -U covenant azor
```

---

## Troubleshooting

### Can't pull images
```bash
# Make sure packages are public on GitHub
# Verify image names in docker-compose.yml
docker-compose config | grep image
```

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Check database connection
docker-compose exec backend env | grep DATABASE_URL
```

### Frontend won't start
```bash
# Check logs
docker-compose logs frontend

# Verify environment variables
docker-compose exec frontend env | grep NEXT_PUBLIC
```

### Database connection refused
```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres
```

---

## Your Configuration Summary

- **Domain**: partner.covenanttechnology.net
- **Database User**: covenant
- **Database Name**: azor
- **Backend Port**: 8000
- **Frontend Port**: 3000
- **PostgreSQL Port**: 5432 (internal)
- **Redis Port**: 6379 (internal)

---

## ⚠️ IMPORTANT: Before Going Live

1. ✅ DNS must point to your server IP
2. ⚠️ Update Certbot email in Step 5: `--email your-email@example.com`
3. ✅ Images are public on GitHub
4. ✅ JWT_SECRET is set to secure value
5. ✅ Database password is secure

---

## Success! 🎉

Once all steps are complete:
- Visit: https://partner.covenanttechnology.net
- Login page should load
- SSL certificate should be valid
- Ready for production use!
