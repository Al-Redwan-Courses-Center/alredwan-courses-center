# Full-Stack Deployment Runbook (Backend + Frontend + Nginx + SSL)

This is a battle-tested, step-by-step runbook for deploying the full Alredwan Courses Center stack (Django backend + Next.js frontend, both via Docker Compose) onto a fresh Ubuntu server behind Cloudflare. It documents the exact commands used for a real production deployment, including gotchas encountered and how to avoid them.

Use this alongside (not instead of) [`backend/docs_v2/deployment-digitalocean.md`](../backend/docs_v2/deployment-digitalocean.md), which covers backend-only Digital Ocean specifics. This runbook covers the combined stack and the issues that only show up once frontend + backend + nginx are wired together.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Install Docker (and the Signed-By apt conflict fix)](#install-docker-and-the-signed-by-apt-conflict-fix)
4. [Clone the Repository](#clone-the-repository)
5. [Configure Environment Files](#configure-environment-files)
6. [docker-compose.yml Structure](#docker-composeyml-structure)
7. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
8. [SSL/TLS with Certbot (Cloudflare DNS)](#ssltls-with-certbot-cloudflare-dns)
9. [Bring the Stack Up](#bring-the-stack-up)
10. [Verification Checklist](#verification-checklist)
11. [Logs & Monitoring](#logs--monitoring)
12. [Known Gotcha: `/api` Suffix + `REST_API_URL`](#known-gotcha-api-suffix--rest_api_url)
13. [Updating/Redeploying Later](#updatingredeploying-later)
14. [Troubleshooting Reference](#troubleshooting-reference)

---

## Prerequisites

- A fresh Ubuntu server (tested on Ubuntu 24.04 "noble"), root or sudo SSH access
- A domain name with DNS pointing at the server's IP
  - If using **Cloudflare**, set SSL/TLS mode to **Full (strict)** once certs are issued (avoids redirect loops)
- GitHub access to the repo (deploy key or PAT)
- Ports 80 and 443 open (firewall/security group)

---

## Initial Server Setup

```bash
# SSH in
ssh deploy@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Create a non-root deploy user if you only have root
sudo adduser deploy
sudo usermod -aG sudo deploy
```

---

## Install Docker (and the Signed-By apt conflict fix)

Standard Docker install:

```bash
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"
newgrp docker
```

### ⚠️ Gotcha: `E: Conflicting values set for option Signed-By`

If Docker (or a previous setup script) was already partially installed, you may hit:

```
E: Conflicting values set for option Signed-By regarding source https://download.docker.com/linux/ubuntu/ noble
```

This happens when **two apt source files** define the same Docker repo with different keyrings — typically an old-style `/etc/apt/sources.list.d/docker.list` (using `/usr/share/keyrings/docker-archive-keyring.gpg`) alongside a newer `/etc/apt/sources.list.d/docker.sources` (using `/etc/apt/keyrings/docker.asc`).

**Fix:**

```bash
# Find the duplicate source files
ls /etc/apt/sources.list.d/ | grep -i docker

# Remove the older/conflicting one (verify which one is stale first!)
sudo rm /etc/apt/sources.list.d/docker.list

sudo apt update   # should succeed now
docker --version
docker compose version
```

---

## Clone the Repository

```bash
cd /home/deploy
git clone git@github.com:YOUR_ORG/alredwan-courses-center.git
cd alredwan-courses-center
git checkout test-prod   # or your production branch
```

---

## Configure Environment Files

The stack needs at minimum:

- `backend.env` / `backend/.env` — Django settings (see [`backend/docs_v2/PRODUCTION_CHECKLIST.md`](../backend/docs_v2/PRODUCTION_CHECKLIST.md) for the full variable list)
- `db.env` — Postgres credentials
- `frontend/.env` — Next.js settings

### `frontend/.env`

```env
# CLIENT_SIDE_ENDPOINT
NEXTAUTH_URL=https://yourdomain.com

# JWT_SECRET
NEXTAUTH_SECRET=<generate-a-strong-random-secret>

# BACKEND_API_URL — used by the browser and any code that doesn't override it
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# INTERNAL_BACKEND_URL_FOR_SERVER_ACTIONS — used by Next.js Server Actions
# running inside the container, bypasses nginx/Cloudflare entirely.
# MUST point at the internal Docker service name + port, NOT the public domain.
REST_API_URL=http://redwan-backend:8000
```

> See [Known Gotcha](#known-gotcha-api-suffix--rest_api_url) below — **do not skip `REST_API_URL`**, it is easy to forget and causes a hard-to-diagnose signup/login failure.

---

## docker-compose.yml Structure

The production compose file runs 4 services: `redwan-backend` (Django, Gunicorn+Uvicorn via Supervisord), `redwan-frontend` (Next.js standalone), `redwan-db` (Postgres 17), and `redis` (Redis 7-alpine). Key points for the frontend service:

```yaml
redwan-frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    target: final       # production stage
  container_name: redwan-frontend
  depends_on:
    redwan-backend:
      condition: service_healthy
  ports:
    - "3000:3000"
  env_file:
    - ./frontend/.env
  environment:
    - REST_API_URL=http://redwan-backend:8000   # belt-and-suspenders override
  restart: unless-stopped
```

Bring up dependent services in order automatically via `depends_on` + healthchecks; don't rely on manual ordering.

---

## Nginx Reverse Proxy Setup

Install nginx and certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/yourdomain`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 20M;

    # NextAuth's own internal routes (session, csrf, callback, signin/signout)
    # MUST go to the frontend, not Django — Djoser also uses "/auth/" so
    # these two prefixes are easy to confuse. Keep this block ABOVE /api/.
    location /api/auth/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Djoser auth endpoints (signup, login, password reset, etc.)
    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /Al-Redwan-superadmin-dashboard/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Static files served by Django/whitenoise
    location /static/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket connections (Django Channels via Uvicorn)
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Everything else → Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

> **Order matters.** Nginx matches the most specific/longest prefix location, but keep `/api/auth/` defined so it isn't accidentally shadowed if you reorganize — always double check with `sudo nginx -T | grep -A5 'location /api'` after edits.

---

## SSL/TLS with Certbot (Cloudflare DNS)

If DNS is proxied through Cloudflare (orange cloud), Certbot's HTTP-01 challenge still works fine since Cloudflare proxies port 80/443 through to origin.

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --email you@example.com --agree-tos --redirect --non-interactive
```

This automatically edits the nginx config to add the `listen 443 ssl` block, sets up the HTTP→HTTPS redirect, and installs a systemd timer for renewal.

**Cloudflare-specific note:** set the SSL/TLS mode in the Cloudflare dashboard to **Full (strict)** once the origin certificate is live. "Flexible" mode will cause redirect loops with the nginx-enforced HTTPS redirect.

Test renewal without actually renewing:

```bash
sudo certbot renew --dry-run
```

---

## Bring the Stack Up

```bash
cd /home/deploy/alredwan-courses-center
docker compose build
docker compose up -d
docker compose ps
```

Run migrations / create superuser as needed:

```bash
docker exec -it redwan-backend python manage.py migrate
docker exec -it redwan-backend python manage.py createsuperuser
```

---

## Verification Checklist

Run these from the server (or externally) after deployment:

```bash
# Frontend home page
curl -I https://yourdomain.com/

# Backend health check
curl -I https://yourdomain.com/health/

# HTTP -> HTTPS redirect
curl -I http://yourdomain.com/

# Signup endpoint actually reaches Django (expect 400 field-required, not NextAuth's error)
docker exec redwan-frontend node -e "fetch('http://redwan-backend:8000/auth/users/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})}).then(async r => { console.log(r.status); console.log(await r.text()); })"
```

Expected: `200`/`200`/`301`, and the signup test should return a Django validation `400` (field-required messages), **not** `"This action with HTTP POST is not supported by NextAuth.js"`.

---

## Logs & Monitoring

| Source | Command | Needs sudo? |
|---|---|---|
| Nginx access log | `sudo tail -f /var/log/nginx/access.log` | Yes |
| Nginx error log | `sudo tail -f /var/log/nginx/error.log` | Yes |
| Backend container logs | `docker logs -f redwan-backend` | No |
| Frontend container logs | `docker logs -f redwan-frontend` | No |
| Certbot logs | `sudo tail -f /var/log/letsencrypt/letsencrypt.log` | Yes |

Docker log rotation should be configured in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

(Restart the Docker daemon after adding this: `sudo systemctl restart docker`.)

---

## Known Gotcha: `/api` Suffix + `REST_API_URL`

**Symptom:** Signup/login (or any Next.js Server Action that calls the backend) fails with an opaque error like:

```
Error: This action with HTTP POST is not supported by NextAuth.js
```

While nginx access logs show something like:

```
"POST /api/auth/users/ HTTP/1.1" 308
"POST /api/auth/users HTTP/1.1" 400
```

**Root cause chain:**

1. `NEXT_PUBLIC_API_URL` is set to `https://yourdomain.com/api` (with the `/api` suffix).
2. Server Actions build request URLs like `<baseURL>/auth/users/` → becomes `https://yourdomain.com/api/auth/users/`.
3. `trailingSlash: false` in `next.config.ts` 308-redirects to the no-trailing-slash form.
4. Nginx's `/api/auth/` location (meant only for NextAuth's own internal routes) intercepts this and proxies it to the **frontend itself** instead of Django, because `/api/auth/...` looks like a NextAuth-internal path.
5. NextAuth doesn't recognize a `users` action → generic 400 error.

**Fix:** Always set `REST_API_URL` (internal, container-to-container, no `/api` suffix, no domain) for anything running server-side inside the frontend container:

```env
REST_API_URL=http://redwan-backend:8000
```

Make sure `frontend/src/lib/api/client.ts`'s base URL resolution prefers `REST_API_URL` first, and only falls back to `NEXT_PUBLIC_API_URL` for client-side/browser calls. If you can't rebuild the image immediately, adding `REST_API_URL` to `frontend/.env` and recreating the container (`docker compose up -d --force-recreate --no-deps redwan-frontend`) is enough — no rebuild required, since it's read from `process.env` at runtime by Server Actions.

Also note: some frontend files that build absolute image URLs (e.g. `image-utils.ts`, `InstructorsRow.tsx`, `PublicCourseCard.tsx`) assume `NEXT_PUBLIC_API_URL` is the **bare domain** (no `/api` suffix). Keep this convention consistent project-wide to avoid similar bugs — bare domain for `NEXT_PUBLIC_API_URL`, and a separate `REST_API_URL` for internal server-to-server calls.

---

## Updating/Redeploying Later

```bash
cd /home/deploy/alredwan-courses-center
git pull origin test-prod
docker compose build
docker compose up -d
```

To only recreate one service (e.g. after an env-only change, no code change):

```bash
docker compose up -d --force-recreate --no-deps <service-name>
```

---

## Troubleshooting Reference

| Problem | Likely Cause | Check |
|---|---|---|
| `Signed-By` apt conflict installing Docker | Duplicate docker apt source files | `ls /etc/apt/sources.list.d/ \| grep docker`, remove the stale one |
| Signup/login fails with NextAuth error | Missing `REST_API_URL`, `/api` suffix bug | See [Known Gotcha](#known-gotcha-api-suffix--rest_api_url) |
| 502 from nginx | Backend/frontend container not running or not healthy | `docker compose ps`, `docker logs <container>` |
| Redirect loop over HTTPS | Cloudflare SSL mode set to "Flexible" instead of "Full (strict)" | Cloudflare dashboard → SSL/TLS → set to Full (strict) |
| Certbot fails HTTP-01 challenge | Port 80 not reachable, or firewall blocking, or Cloudflare "Under Attack Mode" | `sudo ufw status`, temporarily pause Cloudflare proxy (grey cloud) during issuance |
