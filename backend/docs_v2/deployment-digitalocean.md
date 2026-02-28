# 🚀 Digital Ocean Deployment Guide

Complete guide for deploying the Alredwan Courses Center backend to a Digital Ocean Droplet.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Droplet](#create-droplet)
3. [Initial Server Setup](#initial-server-setup)
4. [Install Docker](#install-docker)
5. [Configure Firewall](#configure-firewall)
6. [Deploy Application](#deploy-application)
7. [Setup Nginx Reverse Proxy](#setup-nginx-reverse-proxy)
8. [SSL Certificate (Let's Encrypt)](#ssl-certificate-lets-encrypt)
9. [Environment Variables](#environment-variables)
10. [Database Setup](#database-setup)
11. [Running the Application](#running-the-application)
12. [Monitoring & Logs](#monitoring--logs)
13. [Backup Strategy](#backup-strategy)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Digital Ocean account
- Domain name pointing to your droplet IP
- SSH key pair for secure access
- GitHub repository access (SSH key or token)

---

## Create Droplet

### Recommended Specs

| Environment | Droplet Size | vCPUs | RAM | Storage |
|-------------|--------------|-------|-----|---------|
| Development | Basic | 1 | 1 GB | 25 GB |
| Staging | Basic | 2 | 2 GB | 50 GB |
| **Production** | **General Purpose** | **2** | **4 GB** | **80 GB** |

### Steps

1. Log in to [Digital Ocean](https://cloud.digitalocean.com/)
2. Click **Create** → **Droplets**
3. Choose **Ubuntu 22.04 LTS** (or latest LTS)
4. Select datacenter region (closest to your users)
5. Choose droplet size (see table above)
6. Add your SSH key
7. Enable **Backups** (recommended for production)
8. Click **Create Droplet**

---

## Initial Server Setup

### 1. Connect to Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Update System

```bash
apt update && apt upgrade -y
```

### 3. Create Deploy User (Security)

```bash
# Create user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Test login (in new terminal)
ssh deploy@YOUR_DROPLET_IP
```

### 4. Disable Root Login (Optional but recommended)

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

---

## Install Docker

```bash
# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add deploy user to docker group
sudo usermod -aG docker deploy
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Configure Firewall

```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Deploy Application

### 1. Clone Repository

```bash
cd /home/deploy
git clone git@github.com:YOUR_ORG/alredwan-courses-center.git
cd alredwan-courses-center/backend
```

### 2. Create Production Environment File

```bash
nano .env.production
```

Add your production environment variables (see [Environment Variables](#environment-variables) section).

### 3. Create Production Docker Compose Override

```bash
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  django-web-app:
    env_file:
      - .env.production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres-db:
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Setup Nginx Reverse Proxy

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Create Site Configuration

```bash
sudo nano /etc/nginx/sites-available/alredwan-backend
```

```nginx
upstream django_http {
    server 127.0.0.1:8000;
}

upstream django_ws {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    client_max_body_size 10M;

    # HTTP API requests
    location /api/ {
        proxy_pass http://django_http;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://django_http;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /home/deploy/alredwan-courses-center/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /home/deploy/alredwan-courses-center/backend/media/;
        expires 7d;
    }

    # WebSocket connections
    location /ws/ {
        proxy_pass http://django_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/alredwan-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL Certificate (Let's Encrypt)

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### 3. Auto-Renewal (Already configured by Certbot)

```bash
# Test renewal
sudo certbot renew --dry-run
```

### 4. Update Nginx for HTTPS

After SSL is configured, update `/etc/nginx/sites-available/alredwan-backend`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... rest of the configuration from above
}
```

---

## Environment Variables

Create `.env.production` with these variables:

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-change-this
ALLOWED_HOSTS=api.yourdomain.com,YOUR_DROPLET_IP
CSRF_TRUSTED_ORIGINS=https://api.yourdomain.com,https://yourdomain.com

# Database
DB_NAME=redwan_courses_center_db
DB_USER=redwan_user
DB_PASSWORD=your-strong-database-password
DB_HOST=postgres-db
DB_PORT=5432

# Redis (for Channels)
REDIS_URL=redis://redis:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Cloudinary (for images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

---

## Database Setup

### Option A: Use Docker PostgreSQL (Included)

The docker-compose already includes PostgreSQL. Data is persisted in a Docker volume.

### Option B: Use Digital Ocean Managed Database (Recommended for Production)

1. Create a **Managed PostgreSQL Database** in Digital Ocean
2. Get connection details from the dashboard
3. Update `.env.production` with managed database credentials:

```bash
DB_HOST=your-db-cluster.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your-password
DB_SSLMODE=require
```

4. Remove postgres-db service from docker-compose.prod.yml

---

## Running the Application

### 1. Build and Start

```bash
cd /home/deploy/alredwan-courses-center/backend

# Build images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose ps
```

### 2. Run Migrations

```bash
docker compose exec django-web-app python manage.py migrate
```

### 3. Collect Static Files

```bash
docker compose exec django-web-app python manage.py collectstatic --noinput
```

### 4. Create Superuser

```bash
docker compose exec django-web-app python manage.py createsuperuser
```

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f django-web-app

# Last 100 lines
docker compose logs --tail=100 django-web-app
```

### Check Container Status

```bash
docker compose ps
docker stats
```

### Application Health Check

```bash
curl -s http://localhost:8000/api/health/ | jq
```

### Supervisor Process Status (Inside Container)

```bash
docker compose exec django-web-app supervisorctl status
```

---

## Backup Strategy

### Database Backup Script

Create `/home/deploy/scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/deploy/backups/database
mkdir -p $BACKUP_DIR

# Docker PostgreSQL backup
docker compose -f /home/deploy/alredwan-courses-center/backend/docker-compose.yml \
  exec -T postgres-db pg_dump -U redwan_user redwan_courses_center_db \
  | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Cron Job

```bash
chmod +x /home/deploy/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/deploy/scripts/backup-db.sh >> /home/deploy/logs/backup.log 2>&1
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs django-web-app

# Check if port is in use
sudo lsof -i :8000
sudo lsof -i :8001

# Restart services
docker compose down
docker compose up -d
```

### Database Connection Issues

```bash
# Test database connection
docker compose exec django-web-app python manage.py dbshell

# Check PostgreSQL logs
docker compose logs postgres-db
```

### WebSocket Not Working

1. Check Uvicorn is running on port 8001
2. Verify Nginx WebSocket config
3. Check browser console for connection errors

```bash
# Test WebSocket from server
docker compose exec django-web-app python -c "
import asyncio
import websockets
async def test():
    async with websockets.connect('ws://localhost:8001/ws/attendance/') as ws:
        print('Connected!')
asyncio.run(test())
"
```

### Static Files Not Loading

```bash
# Collect static files
docker compose exec django-web-app python manage.py collectstatic --noinput

# Check Nginx static file path
ls -la /home/deploy/alredwan-courses-center/backend/static/
```

### High Memory Usage

```bash
# Check memory per container
docker stats --no-stream

# Reduce Gunicorn workers in supervisord.conf
# workers 3 → workers 2
```

---

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose restart` | Restart all services |
| `docker compose logs -f` | Follow all logs |
| `docker compose exec django-web-app bash` | Shell into container |
| `docker compose exec django-web-app python manage.py migrate` | Run migrations |
| `docker compose exec django-web-app python manage.py shell` | Django shell |
| `docker compose exec django-web-app supervisorctl status` | Check Gunicorn/Uvicorn |
| `sudo systemctl restart nginx` | Restart Nginx |
| `sudo certbot renew` | Renew SSL certificate |

---

## Next Steps

1. ✅ Set up CI/CD pipeline (GitHub Actions)
2. ✅ Configure monitoring (Sentry, DataDog, or DO App Platform Monitoring)
3. ✅ Set up automated backups to DO Spaces
4. ✅ Configure email alerts for errors
5. ✅ Load testing before launch
