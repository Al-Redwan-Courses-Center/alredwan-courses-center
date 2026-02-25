# Redwan Courses Center – Backend

Backend system for **Redwan Courses Center** (واحة الرضوان), built with Django REST Framework and PostgreSQL.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.14 | Runtime |
| Django | 5.2.7 | Web framework |
| Django REST Framework | 3.16 | REST API |
| Djoser + SimpleJWT | — | Authentication (JWT, phone-based login) |
| PostgreSQL | 17 | Database |
| Redis | 7 | Channel layer (WebSocket) |
| Django Channels | 4.3 | Real-time WebSocket support |
| Cloudinary | — | Media storage |
| Docker + Compose | — | Containerization |
| Gunicorn / Uvicorn | — | HTTP (:8000) / WebSocket (:8001) servers |

---

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── Dockerfile / Dockerfile_Slim
├── docker-entrypoint.sh
├── Redwan_courses_center/       # Django project settings & root URL config
├── users/                       # Custom user model, roles (Student, Parent, Instructor)
├── courses/                     # Seasons, Courses, Lectures, Tags, Exams
├── attendance/                  # Instructor & student attendance, devices, cron jobs
├── enrollments_payments/        # Enrollment requests, enrollments, payments
├── parents/                     # Parent → Child management
├── core/                        # Shared utilities, ASGI config, health check
├── scripts/                     # Seed data, migration cleanup, test scripts
├── docs_v2/                     # 📚 API & system documentation (source of truth)
├── static/                      # Collected static files
└── media/                       # Local media (production uses Cloudinary)
```

---

## Quick Start (Local Development)

### 1. Virtual Environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate    # Linux/Mac
# .venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 2. Environment Variables

```bash
cp .env.local .env
```

Edit `.env` and set `DATABASE_HOST=localhost` for local development.

Required variables:

```env
DJANGO_SECRET_KEY=<your-secret-key>
DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

DATABASE_ENGINE=postgresql
DATABASE_NAME=redwan_db
DATABASE_USERNAME=redwan_user
DATABASE_PASSWORD=<password>
DATABASE_HOST=localhost          # 'db' for Docker, 'localhost' for local
DATABASE_PORT=5432
```

> ⚠️ `DJANGO_SECRET_KEY` **must not be empty** or Django will fail to start.

### 3. Database Setup

Make sure PostgreSQL is running, then:

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
python manage.py runserver
```

The API will be at `http://localhost:8000/api/` and admin panel at `http://localhost:8000/Al-Redwan-superadmin-dashboard/`.

---

## Running with Docker

### Start All Services

```bash
# From the project root (not backend/)
docker compose up --build
```

This will start PostgreSQL, apply migrations, collect static files, and run the Django server.

### Common Docker Commands

```bash
docker compose up -d                                        # Start in background
docker compose logs -f redwan-backend                       # View backend logs
docker compose exec redwan-backend python manage.py <cmd>   # Run Django command
docker compose down                                         # Stop containers
docker compose down -v                                      # Stop + delete data
```

### Docker vs Local

| Task | Local | Docker |
|------|-------|--------|
| `makemigrations` | ✅ **Required** | ❌ Never |
| `migrate` | ✅ Manual | ✅ Automatic (entrypoint) |
| `runserver` | ✅ Manual | ✅ Automatic (entrypoint) |
| `createsuperuser` | ✅ Manual | `docker compose exec redwan-backend python manage.py createsuperuser` |
| `test` | ✅ Manual | `docker compose exec redwan-backend python manage.py test` |

---

## Migration Workflow

### Rules

1. **NEVER** run `makemigrations` inside Docker — only locally
2. **ALWAYS** commit migration files to git — they are source code
3. Run `makemigrations` **before** pushing your branch

### Creating Migrations

```bash
source .venv/bin/activate

python manage.py makemigrations --dry-run   # Preview
python manage.py makemigrations             # Create
python manage.py migrate                    # Apply

git add */migrations/*.py
git commit -m "Add migration for <description>"
```

### Handling Merge Conflicts

```bash
# Auto-merge (if Django can resolve it):
python manage.py makemigrations --merge

# If that fails, coordinate with the team on which migrations to keep
```

### Checking Status

```bash
python manage.py showmigrations
python manage.py sqlmigrate <app_name> <migration_number>
```

---

## Testing

```bash
# All tests
python manage.py test

# Specific app
python manage.py test users
python manage.py test courses
python manage.py test attendance
python manage.py test enrollments_payments
python manage.py test parents

# Specific test case
python manage.py test attendance.tests.test_lecture_attendance_details

# With verbosity
python manage.py test -v 2
```

---

## Cron Jobs

Managed via `django-crontab`. Defined in `settings.py` under `CRONJOBS`.

| Schedule | Job | Purpose |
|----------|-----|---------|
| Sunday 00:05 | `generate_instructor_attendance_weekly` | Create attendance records for the week |
| Daily 23:59 | `mark_absent_daily` | Mark un-checked-in instructors as absent |
| Daily 00:01 | `mark_absent_for_yesterday` | Fallback for missed records |
| Daily 06:00 | `update_pending_to_not_started` | Log expected attendance count |

```bash
python manage.py crontab add      # Register cron jobs
python manage.py crontab show     # List active jobs
python manage.py crontab remove   # Remove all jobs
```

---

## API Documentation

> **📚 Full documentation lives in [`docs_v2/`](docs_v2/README.md) — this is the source of truth for the whole team.**

| Document | Description |
|----------|-------------|
| [README (Index)](docs_v2/README.md) | Complete endpoint reference, base URLs, auth overview |
| [Authentication](docs_v2/authentication.md) | JWT auth, login, registration, password management |
| [Courses & Lectures](docs_v2/courses-api.md) | Course CRUD, lecture management, ratings |
| [Users](docs_v2/users-api.md) | Instructors, landing page endpoints |
| [Parents](docs_v2/parents-api.md) | Child management |
| [Enrollments](docs_v2/enrollment-api.md) | Enrollment requests, approvals, instructor views |
| [Attendance](docs_v2/attendance-api.md) | Fingerprint devices, admin dashboard, student attendance |
| [WebSocket](docs_v2/websocket.md) | Real-time attendance updates |
| [Production Checklist](docs_v2/PRODUCTION_CHECKLIST.md) | Deployment, Nginx, SSL, Docker production config |
| [Excel Export Guide](docs_v2/EXCEL_EXPORT_GUIDE.md) | Admin Excel export mixin usage |

### Internal Docs (Backend Developers Only)

| Document | Description |
|----------|-------------|
| [Attendance System Logic](docs_v2/internal/attendance-system-logic.md) | Business rules, data models, cron logic |
| [Signals & Lecture Generation](docs_v2/internal/signals-and-lecture-generation.md) | Auto lecture generation from schedules |

---

## Key Architecture Notes

### Authentication

- Login uses **phone number** (`phone_number1`), not email or username
- JWT prefix is **`JWT`** (not `Bearer`): `Authorization: JWT <access_token>`
- Access tokens, refresh tokens, and Djoser endpoints under `/auth/`

### Server Ports

| Port | Server | Protocol | Purpose |
|------|--------|----------|---------|
| 8000 | Gunicorn | HTTP | REST API |
| 8001 | Uvicorn | WebSocket | Real-time updates |

Both are managed by **Supervisord** in production (see `docker-entrypoint.sh`).

### Phone Number Format

All phone numbers must be in **E.164 format** with country code:
- ✅ `+201234567890`
- ❌ `01234567890`

---

## Common Issues

### `SECRET_KEY setting must not be empty`

→ Make sure `.env` exists in `backend/` and `DJANGO_SECRET_KEY` is set.

### `could not translate host name "db"`

→ You're running locally but `.env` has `DATABASE_HOST=db`. Change to `localhost`.

### Migration conflicts after git merge

→ Try `python manage.py makemigrations --merge`. If that fails, coordinate with the team.

### `No changes detected` but model changed

→ Specify the app: `python manage.py makemigrations <app_name>`. Check it's in `INSTALLED_APPS`.

---

## Team Rules

- Migrations are created **locally only**, never in Docker
- All migration files must be **committed to git**
- No direct database schema changes
- API documentation in `docs_v2/` is the contract with the frontend team
- Follow PEP 8, add docstrings, no `print()` statements in production code

### PR Checklist

- [ ] Migrations created locally and committed
- [ ] `python manage.py migrate` applies cleanly
- [ ] `python manage.py check` passes
- [ ] `python manage.py test` passes
- [ ] No `print()` left in code
- [ ] `docs_v2/` updated if endpoints changed

---

## Useful Commands

```bash
# Local dev
source .venv/bin/activate
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py test
python manage.py check
python manage.py shell
python manage.py collectstatic --noinput

# Docker
docker compose up --build
docker compose exec redwan-backend python manage.py <command>
docker compose logs -f redwan-backend

# Cron
python manage.py crontab add
python manage.py crontab show

# Migrations
python manage.py showmigrations
python manage.py makemigrations --merge
python scripts/delete_migrations.py --dry-run   # Preview cleanup
```
