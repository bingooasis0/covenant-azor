# deploy/README.md
# Covenant Azor Deployment (Staging)

## Docker Compose (quick staging-like)
- Edit `deploy/docker-compose.yml`, replace OWNER/REPO and secrets.
- Run: `docker compose -f deploy/docker-compose.yml up -d`

## Kubernetes (staging)
1. Replace `OWNER/REPO` in images and set secrets.
2. Apply:
   kubectl apply -f deploy/k8s/namespace.yaml
   kubectl apply -f deploy/k8s/configmap.yaml
   kubectl apply -f deploy/k8s/secret.yaml
   kubectl apply -f deploy/k8s/backend-deployment.yaml
   kubectl apply -f deploy/k8s/frontend-deployment.yaml
   kubectl apply -f deploy/k8s/ingress.yaml

- Set TLS secret `staging-tls` beforehand (e.g., cert-manager).
- Backend `COOKIE_DOMAIN` set to `.staging.covenant-azor.example` and `COOKIE_SECURE=true`.
