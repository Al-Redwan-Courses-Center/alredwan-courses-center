# Redwan Courses Center – Backend

Backend system for **Redwan Courses Center** (واحة الرضوان), built with **Django 5**, **Django REST Framework**, **JWT authentication (Djoser)**, **PostgreSQL**, **Docker**, and **Channels**.

This project supports both **local development** and **Docker deployment**. Migrations must be created locally and committed to git.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure-high-level)
- [Quick Start (Local Development)](#-quick-start-local-development)
- [Running with Docker](#-running-with-docker)
- [Migration Workflow](#-migration-workflow)
- [Data Models Overview](#data-models-overview)
- [Environment Variables](#environment-variables)
- [Admin Panel](#admin-panel)
- [Authentication (Djoser + JWT)](#authentication-djoser--jwt)
- [WebSocket Endpoints](#websocket-endpoints)
- [Cron Jobs](#cron-jobs)
- [Testing](#testing)
- [Redis & Channels](#redis--channels)
- [Common Issues](#common-issues)
- [Team Rules](#team-rules-non-negotiable)

---

## Tech Stack

- Python 3.14
- Django 5.2
- Django REST Framework
- Djoser (JWT Authentication)
- PostgreSQL 17
- Docker & Docker Compose
- Channels + Redis
- Timezone: `Africa/Cairo`
- Primary Language: Arabic (`ar`)

---

## Project Structure (High Level)

```
backend/
├── .env                     # Environment variables (git-ignored)
├── .env.local               # Template for local development
├── .env.example             # Template for Docker
├── .venv/                   # Virtual environment (git-ignored)
├── manage.py
├── requirements.txt
├── scripts/
│   └── delete_migrations.py # Utility to clean migrations
├── Redwan_courses_center/   # Project settings & URLs
├── users/                   # Custom user model & roles (Student, Parent, Instructor)
├── courses/                 # Seasons, Courses, Lectures, Exams, Tags
├── attendance/              # Lecture attendance, Ratings, Devices, Cron logs
├── enrollments_payments/    # Enrollments, Payments, Refund requests
├── core/                    # Shared utilities & ASGI configuration
├── static/                  # Collected static files
├── media/                   # User-uploaded files
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Setup Virtual Environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# For local development (connecting to local PostgreSQL):
cp .env.local .env
# DATABASE_HOST should be 'localhost' for local dev

# For Docker development:
# Keep DATABASE_HOST=db in .env
```

### 3. Run Commands Locally

```bash
# Always use the venv python:
.venv/bin/python manage.py <command>

# Or activate first:
source .venv/bin/activate
python manage.py <command>
```

### 4. Start Development Server

```bash
# Make sure PostgreSQL is running (locally or via Docker)
python manage.py migrate
python manage.py runserver
```

---

## 🐳 Running with Docker

### Start All Services

```bash
docker compose up --build
```

This will:
* Start PostgreSQL
* Apply migrations automatically
* Collect static files
* Run Django development server on `http://localhost:8000`

### Docker Commands

```bash
# Start in background:
docker-compose up -d

# View logs:
docker-compose logs -f backend

# Run Django commands in container:
docker-compose exec backend python manage.py <command>

# Reset everything (WARNING: deletes data):
docker-compose down -v
docker-compose up --build
```

### Docker vs Local Development

| Task | Local | Docker |
|------|-------|--------|
| `makemigrations` | ✅ **Yes (required)** | ❌ Never |
| `migrate` | ✅ Yes | ✅ Auto (entrypoint) |
| `runserver` | ✅ Yes | ✅ Auto (entrypoint) |
| `createsuperuser` | ✅ Yes | ✅ `docker-compose exec backend python manage.py createsuperuser` |
| `test` | ✅ Yes | ✅ Yes |

---

## 📦 Migration Workflow

### ⚠️ IMPORTANT RULES

1. **NEVER run `makemigrations` inside Docker** — only locally
2. **ALWAYS commit migration files to git** — they are source code
3. **Run `makemigrations` BEFORE pushing** your branch

### Creating Migrations

```bash
cd backend
source .venv/bin/activate

# Check what migrations would be created:
python manage.py makemigrations --dry-run

# Create migrations:
python manage.py makemigrations

# Review the generated files, then commit:
git add */migrations/*.py
git commit -m "Add migration for <description>"
```

### Applying Migrations

```bash
# Locally:
python manage.py migrate

# In Docker (automatic via entrypoint):
docker-compose up
```

### Handling Merge Conflicts in Migrations

When merging branches with conflicting migrations:

```bash
# Option 1: Auto-merge (if Django can resolve it)
python manage.py makemigrations --merge

# Option 2: Nuclear reset (development only!)
# WARNING: This deletes ALL data!
python scripts/delete_migrations.py --dry-run  # preview
python scripts/delete_migrations.py --yes      # delete
python manage.py makemigrations
python manage.py migrate --fake-initial  # or drop DB and migrate fresh
```

### Checking Migration Status

```bash
# Show all migrations and their status:
python manage.py showmigrations

# Show SQL that would be run:
python manage.py sqlmigrate <app_name> <migration_number>
```

---

## Data Models Overview

### Users App (`users/`)

| Model | Description |
|-------|-------------|
| `CustomUser` | Base user model with phone number authentication (E.164 format). Fields: `phone_number1` (primary), `phone_number2`, `email`, `dob`, `gender`, `identity_number`, `role`, `is_verified` |
| `StudentUser` | Student profile linked to CustomUser |
| `Parent` | Parent profile for managing children |
| `Instructor` | Instructor profile with teaching capabilities |

**Note:** Authentication uses `phone_number1` as the unique identifier (not email/username).

### Courses App (`courses/`)

| Model | Description |
|-------|-------------|
| `Season` | Academic periods (Summer Camp, School, Ramadan, Eid, Other). Has `is_active` flag |
| `Course` | Course with name, description, dates, price, linked to Season and Instructor |
| `Lecture` | Individual lecture with date, time, status (Scheduled/Completed/Cancelled), `attendance_taken` flag |
| `Exam` | Exam linked to a course |
| `Tag` | Tags for categorizing courses |

**Weekday Choices:** Saturday=0 through Friday=6

### Attendance App (`attendance/`)

| Model | Description |
|-------|-------------|
| `LectureAttendance` | Attendance record per student/child per lecture. Includes `present`, `rating` (1.00-10.00), `notes`, `marked_by`, `marked_at` |
| `StudentInstructorRating` | Rating of instructors by students |
| `Device` | Registered devices for attendance |
| `AttendanceCronLog` | Logs for cron job executions |

**Business Rules:**
- Exactly one of `child` or `student` must be set per attendance record
- Rating is required when marking attendance (`present` is set)
- Rating range: 1.00 - 10.00

### Enrollments & Payments App (`enrollments_payments/`)

| Model | Description |
|-------|-------------|
| `EnrollmentRequest` | Pending enrollment requests |
| `Enrollment` | Active enrollment linking student/child to course. Status: Active, Completed, Dropped, Refunded |
| `Payment` | Payment records for enrollments |
| `RefundRequest` | Refund request management |

**Business Rules:**
- Exactly one of `child` or `student` per enrollment
- Unique constraint: one enrollment per course per participant

---

## Environment Variables

Create a `.env` file in the backend or project root (same level as `docker-compose.yml`) with the following content (replace values as needed or ask the team lead):

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

DATABASE_ENGINE=postgresql
DATABASE_NAME=redwan_db
DATABASE_USERNAME=redwan_user
DATABASE_PASSWORD=strongpassword
DATABASE_HOST=db
DATABASE_PORT=5432
```

⚠️ `DJANGO_SECRET_KEY` **must not be empty** or Django will fail to start.

**Note:** The project uses `python-decouple` to load environment variables. It automatically reads from `.env` file for local development, or from system environment variables in Docker.

---

## Admin Panel

Admin panel is available at:

```
http://localhost:8000/Al-Redwan-superadmin-dashboard/
```

Admin branding is customized in `urls.py`.

---

## Authentication (Djoser + JWT)

Authentication is handled using **Djoser** with **JWT**.

### Base Auth URL

```
/auth/
```

### Main Endpoints

| Purpose         | Method | Endpoint                    |
| --------------- | ------ | --------------------------- |
| Register        | POST   | `/auth/users/`              |
| Login (JWT)     | POST   | `/auth/jwt/create/`         |
| Refresh token   | POST   | `/auth/jwt/refresh/`        |
| Verify token    | POST   | `/auth/jwt/verify/`         |
| Get profile     | GET    | `/auth/users/me/`           |
| Change password | POST   | `/auth/users/set_password/` |

📌 **Frontend developers should rely on these endpoints only.(for now)**

---

## WebSocket Endpoints

Real-time communication is handled via Django Channels.

### Attendance Updates

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/attendance/` | Real-time attendance updates for instructors |

**Usage:**
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/attendance/');

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Attendance update:', data);
};
```

**Events Received:**
- `attendance_update` — Sent when attendance is marked for a lecture

---

## Testing

Run tests inside the Docker container:

```bash
# Run all tests
dj test

# Run tests for a specific app
dj test users
dj test courses
dj test attendance
dj test enrollments_payments

# Run with verbosity
dj test -v 2

# Run a specific test case
dj test users.tests.TestCustomUser
```

---

## Where Auth Docs Live (For Frontend Team)

All authentication endpoints are documented in this README under **Authentication (Djoser + JWT)**.

📚 **Detailed API documentation:** [`docs/authentication.md`](docs/authentication.md)

The detailed docs include:
- Complete request/response examples
- JavaScript/Axios code samples
- Token management best practices
- Error handling guide

---

## Cron Jobs

Configured using `django-crontab`:

| Schedule | Job | Description |
|----------|-----|-------------|
| Every Sunday at 00:05 AM | `generate_instructor_attendance_weekly` | Generates weekly instructor attendance records |
| Daily at 11:59 PM | `mark_absent_daily` | Marks students as absent if attendance not taken |

Cron jobs are defined in `settings.py` under `CRONJOBS`.

**Managing Cron Jobs:**

```bash
# Add cron jobs to the system
dj crontab add

# Show current cron jobs
dj crontab show

# Remove all cron jobs
dj crontab remove
```

---

## Redis & Channels

- **Channels** is configured with `core.asgi.application`
- **Redis** backend is configured for channel layers (host: `redis`, port: `6379`)
- WebSocket consumers are in `attendance/consumers.py`

**Channel Layer Configuration:**
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        },
    },
}
```

---

## Common Issues

### ❌ `SECRET_KEY setting must not be empty`

✔ Solutions:
- Make sure `.env` file exists in `backend/` directory
- Check that `DJANGO_SECRET_KEY` is set in `.env`
- Restart containers / re-run command

### ❌ `could not translate host name "db"`

✔ Solutions:
- You're running locally but `.env` has `DATABASE_HOST=db`
- Change to `DATABASE_HOST=localhost` for local development
- Or start PostgreSQL via Docker: `docker-compose up db`

### ❌ Migration conflicts after git merge

✔ Solutions:
```bash
# Try auto-merge first:
python manage.py makemigrations --merge

# If that fails, discuss with team about which migrations to keep
```

### ❌ "No changes detected" but model changed

✔ Solutions:
```bash
# Specify the app explicitly:
python manage.py makemigrations <app_name>

# Check if app is in INSTALLED_APPS in settings.py
```

---

## Team Rules (Non-Negotiable)

* **Migrations are created locally, never in Docker**
* All migration files must be committed to git
* No direct DB schema changes
* Docker is for running/testing, not for creating migrations
* API is the contract with frontend

---

## 👥 Team Checklist Before PR

- [ ] Created migrations locally (`python manage.py makemigrations`)
- [ ] Tested migrations apply cleanly (`python manage.py migrate`)
- [ ] Committed migration files to git
- [ ] Did NOT modify migrations created by others (unless merging)
- [ ] Ran `python manage.py check` with no errors
- [ ] Tests pass (`python manage.py test`)

---

## Contributing Guidelines

### Branch Naming Convention

```
feature/<ticket-id>-<short-description>
bugfix/<ticket-id>-<short-description>
hotfix/<ticket-id>-<short-description>
```

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings to all models, views, and functions
- Keep functions small and focused

### Pull Request Checklist

- [ ] Tests pass (`dj test`)
- [ ] Migrations are included (if model changes)
- [ ] No `print()` statements left in code
- [ ] Docstrings added for new code
- [ ] README updated (if needed)

---

## Useful Commands Reference

### Local Development
```bash
# Activate virtual environment
source .venv/bin/activate

# Create migrations (LOCAL ONLY)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Run development server
python manage.py runserver

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Check for issues
python manage.py check

# Django shell
python manage.py shell
```

### Docker Commands
```bash
# Start containers
docker-compose up --build

# Start in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f backend

# Run command in container
docker-compose exec backend python manage.py <command>

# Reset everything (deletes data)
docker-compose down -v
```

### Migration Utilities
```bash
# Preview migrations to delete
python scripts/delete_migrations.py --dry-run

# Delete all migrations (use with caution!)
python scripts/delete_migrations.py --yes

# Show migration status
python manage.py showmigrations

# Merge conflicting migrations
python manage.py makemigrations --merge
```

---
