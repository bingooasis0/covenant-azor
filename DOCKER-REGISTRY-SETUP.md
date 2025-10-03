# Docker Registry Setup Guide

## Overview

Your Docker images will be automatically built and pushed to GitHub Container Registry (ghcr.io) whenever you push code to GitHub. This allows you to pull them directly on your Ubuntu server.

**Your Images:**
- Backend: `ghcr.io/bingooasis0/covenant-azor-backend:latest`
- Frontend: `ghcr.io/bingooasis0/covenant-azor-frontend:latest`

---

## Step 1: Make Repository Package Public (One-Time Setup)

After your first push triggers the GitHub Actions, you need to make the Docker images public:

1. Go to https://github.com/bingooasis0/covenant-azor
2. Click on **"Packages"** on the right sidebar (you'll see this after first build)
3. Click on `covenant-azor-backend`
4. Click **"Package settings"** (bottom right)
5. Scroll down to **"Danger Zone"**
6. Click **"Change visibility"** → Select **"Public"**
7. Repeat steps 3-6 for `covenant-azor-frontend`

**Why?** By default, GitHub packages are private and require authentication. Making them public allows your Ubuntu server to pull them without credentials.

---

## Step 2: Push Your Code to GitHub

The GitHub Actions workflows I created will automatically build your Docker images when you push code:

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add Docker registry workflows and production config"

# Push to GitHub
git push origin main
```

---

## Step 3: Monitor the Build

1. Go to https://github.com/bingooasis0/covenant-azor/actions
2. You'll see two workflows running:
   - **Build and Push Backend**
   - **Build and Push Frontend**
3. Click on each to watch the build progress
4. Wait for both to complete (usually 5-10 minutes)

---

## Step 4: Verify Images Are Published

After the builds complete:

1. Go to https://github.com/bingooasis0?tab=packages
2. You should see:
   - `covenant-azor-backend`
   - `covenant-azor-frontend`
3. Both should show as **"latest"** tag

---

## Step 5: Deploy on Ubuntu Server

Now you can pull and run on your Ubuntu server:

```bash
# SSH into your Ubuntu server
ssh your-user@your-server-ip

# Clone the repository
git clone https://github.com/bingooasis0/covenant-azor.git
cd covenant-azor/deploy

# Pull the images (no authentication needed if public)
docker-compose pull

# Start the application
docker-compose up -d

# Check logs
docker-compose logs -f
```

That's it! Docker will automatically download the images from GitHub Container Registry.

---

## Future Updates

Whenever you make changes and want to deploy:

```bash
# On your Windows machine:
git add .
git commit -m "Your changes"
git push origin main

# Wait for GitHub Actions to build (5-10 minutes)

# On your Ubuntu server:
cd covenant-azor/deploy
docker-compose pull       # Download updated images
docker-compose up -d      # Restart with new images
```

---

## Troubleshooting

### Build fails with "permission denied"
- The workflows use `GITHUB_TOKEN` which is automatically provided
- Make sure GitHub Actions is enabled in your repo settings

### Can't pull images on Ubuntu server
- Verify images are set to **Public** in package settings
- Check image names match exactly: `ghcr.io/bingooasis0/covenant-azor-backend:latest`

### Want to see build logs
- Go to https://github.com/bingooasis0/covenant-azor/actions
- Click on the failed workflow
- Click on the job to see detailed logs

---

## Alternative: Manual Build & Push (If GitHub Actions Doesn't Work)

If you prefer to build and push manually from your Windows machine:

```bash
# Build images
docker build -f backend/Dockerfile -t ghcr.io/bingooasis0/covenant-azor-backend:latest .
docker build -f frontend/Dockerfile -t ghcr.io/bingooasis0/covenant-azor-frontend:latest .

# Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u bingooasis0 --password-stdin

# Push images
docker push ghcr.io/bingooasis0/covenant-azor-backend:latest
docker push ghcr.io/bingooasis0/covenant-azor-frontend:latest
```

**Note:** You'll need a GitHub Personal Access Token with `write:packages` permission.
Create one at: https://github.com/settings/tokens
