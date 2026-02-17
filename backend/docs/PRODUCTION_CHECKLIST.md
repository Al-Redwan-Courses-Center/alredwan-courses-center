# 🚀 Production Deployment Checklist

This document outlines all changes required to prepare the Alredwan Courses Center backend for production deployment.

---

## 📋 Table of Contents

1. [Server Architecture](#server-architecture)
2. [Environment Variables](#environment-variables)
3. [Django Settings Changes](#django-settings-changes)
4. [Security Checklist](#security-checklist)
5. [Database Configuration](#database-configuration)
6. [Static Files & Media](#static-files--media)
7. [Docker Configuration](#docker-configuration)
8. [Nginx/Reverse Proxy Setup](#nginxreverse-proxy-setup)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Monitoring & Logging](#monitoring--logging)
11. [Backup Strategy](#backup-strategy)

---

## 🏗️ Server Architecture

The production setup runs two separate servers managed by **Supervisor**:

| Server | Port | Protocol | Purpose |
|--------|------|----------|---------|
| **Gunicorn** | 8000 | HTTP/WSGI | REST API requests |
| **Uvicorn** | 8001 | WebSocket/ASGI | Real-time connections |

### Why Two Servers?

- **Gunicorn**: Optimized for synchronous HTTP requests, handles Django's WSGI application efficiently
- **Uvicorn**: Handles async WebSocket connections via Django Channels

---

## 🔐 Environment Variables

### Required Production Variables

Create a `.env` file with the following (DO NOT commit to git):

```env
# Django Core
DJANGO_SECRET_KEY=<generate-a-strong-64-char-key>
DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DJANGO_LOGLEVEL=WARNING

# Database
DATABASE_ENGINE=postgresql
DATABASE_NAME=redwan_courses_prod
DATABASE_USERNAME=redwan_user
DATABASE_PASSWORD=<strong-password>
DATABASE_HOST=db  # or your RDS/Cloud SQL host
DATABASE_PORT=5432

# Redis (for Channels)
REDIS_URL=redis://redis:6379/0

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS (Frontend domains)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# CSRF
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Generate a Secure Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## ⚙️ Django Settings Changes

### File: `Redwan_courses_center/settings.py`

#### 1. Security Settings (Add at the bottom)

```python
# ============================================
# PRODUCTION SECURITY SETTINGS
# ============================================

if not DEBUG:
    # HTTPS/SSL
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Cookies
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    
    # Content Security
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    
    # CORS - Restrict to your frontend domain
    CORS_ALLOWED_ORIGINS = config(
        "CORS_ALLOWED_ORIGINS",
        default="",
        cast=Csv()
    )
    CORS_ALLOW_CREDENTIALS = True
    
    # CSRF Trusted Origins
    CSRF_TRUSTED_ORIGINS = config(
        "CSRF_TRUSTED_ORIGINS",
        default="",
        cast=Csv()
    )
```

#### 2. WhiteNoise Static File Compression

```python
# Static files with WhiteNoise compression
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

#### 3. Logging Configuration

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': config('DJANGO_LOGLEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOGLEVEL', default='INFO'),
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
```

#### 4. Remove Debug Toolbar in Production

Update the `INSTALLED_APPS` section:

```python
INSTALLED_APPS = [
    # ... other apps
]

# Only include debug toolbar in development
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
```

And update `MIDDLEWARE`:

```python
MIDDLEWARE = [
    # ... other middleware
]

if DEBUG:
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

---

## 🔒 Security Checklist

### Before Going Live

- [ ] `DEBUG=False` in production
- [ ] Strong `DJANGO_SECRET_KEY` (64+ characters)
- [ ] `ALLOWED_HOSTS` only contains your domains
- [ ] SSL certificate installed and working
- [ ] HTTPS redirect enabled
- [ ] CORS restricted to frontend domains only
- [ ] Database credentials are strong and unique
- [ ] Admin URL is customized (not `/admin/`)
- [ ] Rate limiting configured
- [ ] Remove any test/debug endpoints
- [ ] All sensitive data in environment variables

### Password/Auth Security

- [ ] JWT token expiration is reasonable (15-30 min for access, 7 days for refresh)
- [ ] Password validation rules enforced
- [ ] Failed login rate limiting
- [ ] Password reset tokens expire quickly

---

## 🗄️ Database Configuration

### PostgreSQL Production Settings

Add connection pooling for better performance:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABASE_NAME'),
        'USER': config('DATABASE_USERNAME'),
        'PASSWORD': config('DATABASE_PASSWORD'),
        'HOST': config('DATABASE_HOST'),
        'PORT': config('DATABASE_PORT', default=5432, cast=int),
        'CONN_MAX_AGE': 600,  # Connection pooling - keep connections for 10 min
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

### Database Backup Script

Create `scripts/backup_db.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
pg_dump -h $DATABASE_HOST -U $DATABASE_USERNAME $DATABASE_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

---

## 📁 Static Files & Media

### WhiteNoise Configuration (Already Set)

WhiteNoise is configured in `MIDDLEWARE` to serve static files efficiently.

### Collect Static Files

Run before deployment:

```bash
python manage.py collectstatic --noinput
```

### Media Files

Media files are stored on **Cloudinary** (already configured). Ensure your Cloudinary credentials are set in production.

---

## 🐳 Docker Configuration

### Production Docker Compose

Use the `docker-compose.prod.yml` for production:

```yaml
services:
  db:
    image: postgres:17
    restart: always
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env
    # Remove port exposure in production (internal only)
    # ports:
    #   - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  django-web-app:
    build: .
    restart: always
    ports:
      - "8000:8000"  # Gunicorn (HTTP)
      - "8001:8001"  # Uvicorn (WebSocket)
    depends_on:
      - db
      - redis
    env_file:
      - .env
    # Remove volume mount in production (use built image)
    # volumes:
    #   - .:/app

volumes:
  postgres_data:
  redis_data:
```

### Build and Deploy

```bash
# Build production image
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🌐 Nginx/Reverse Proxy Setup

### Nginx Configuration

Create `/etc/nginx/sites-available/redwan-courses`:

```nginx
upstream gunicorn {
    server 127.0.0.1:8000;
}

upstream uvicorn {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files
    location /static/ {
        alias /app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket endpoint
    location /ws/ {
        proxy_pass http://uvicorn;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # API and all other requests
    location / {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Request size limit
    client_max_body_size 10M;
}
```

### With Nginx, Simplify Docker Ports

When using Nginx as a reverse proxy, you can use a single external port:

- Nginx listens on 80/443
- Routes `/ws/` → Uvicorn (8001)
- Routes everything else → Gunicorn (8000)

---

## 🔐 SSL/TLS Configuration

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoring & Logging

### Health Check Endpoint

Add to `core/views.py`:

```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """Health check endpoint for load balancers"""
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

Add to `Redwan_courses_center/urls.py`:

```python
urlpatterns = [
    path('health/', health_check, name='health_check'),
    # ... other urls
]
```

### Recommended Monitoring Tools

- **Sentry**: Error tracking and performance monitoring
- **Prometheus + Grafana**: Metrics and dashboards
- **ELK Stack**: Centralized logging

---

## 💾 Backup Strategy

### Database Backups

1. **Daily automated backups** to cloud storage (S3, GCS)
2. **Weekly full backups** retained for 30 days
3. **Point-in-time recovery** enabled on managed databases

### Backup Cron Job

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /app/scripts/backup_db.sh >> /var/log/backups.log 2>&1
```

---

## ✅ Pre-Deployment Checklist

### Code & Configuration

- [ ] All tests passing
- [ ] `DEBUG=False`
- [ ] Secret key is unique and secure
- [ ] Database migrations committed and tested
- [ ] Static files collected
- [ ] No hardcoded credentials in code

### Infrastructure

- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] Log rotation configured
- [ ] Firewall rules in place

### DNS & Networking

- [ ] DNS records pointing to server
- [ ] CORS configured for frontend domain
- [ ] CSRF trusted origins set

### Final Steps

1. Run migrations: `python manage.py migrate`
2. Create superuser: `python manage.py createsuperuser`
3. Collect static: `python manage.py collectstatic`
4. Test all endpoints
5. Monitor logs for errors

---

## 📞 Support

For deployment issues, check:

1. Docker logs: `docker compose logs -f`
2. Nginx logs: `/var/log/nginx/error.log`
3. Application logs: Supervisor stdout/stderr

---

*Last updated: February 2026*
