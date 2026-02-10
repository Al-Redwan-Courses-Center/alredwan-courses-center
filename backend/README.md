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
- [API Documentation](#api-documentation)
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
| `InstructorAttendance` | Instructor check-in/check-out record with rating. Supports both lecture and supervision attendance types |
| `SupervisorSchedule` | Weekly schedule for supervisor instructors (day, start/end time, grace period) |
| `LectureAttendance` | Attendance record per student/child per lecture. Includes `present`, `rating` (1.00-10.00), `notes`, `marked_by`, `marked_at` |
| `AttendanceDevice` | Registered fingerprint/RFID devices for attendance |
| `AttendanceCronLog` | Logs for cron job executions |

**Instructor Attendance Types:**
- `LECTURE` — Attendance for instructors assigned to teach a lecture
- `SUPERVISION` — Attendance for supervisors based on their weekly schedule

**Instructor Attendance Statuses:**
- `NOT_STARTED` — Day hasn't started yet
- `PENDING` — Awaiting check-in
- `PRESENT` — Checked in on time
- `LATE` — Checked in after grace period
- `ABSENT` — Did not check in (marked by cron or admin)

**Rating Logic:**
- `null` — Absent/not started (cannot rate)
- `0.00` — Present but not rated yet
- `1.00-10.00` — Actual rating given by admin

📚 **Detailed API documentation:** [`attendance/docs/`](attendance/docs/)

**Business Rules:**
- Exactly one of `child` or `student` must be set per lecture attendance record
- Instructors can have multiple attendance records per day (lecture + supervision)
- Rating is required when marking student attendance (`present` is set)
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
| `ws://localhost:8000/ws/attendance/?token=<jwt_token>` | Real-time attendance updates for admin dashboard |

**Authentication:**
WebSocket connections require JWT authentication via query string.

**Usage:**
```javascript
// Get the JWT token first from login
const accessToken = 'your-jwt-access-token';

// Connect with authentication
const socket = new WebSocket(`ws://localhost:8000/ws/attendance/?token=${accessToken}`);

socket.onopen = function() {
    console.log('Connected to attendance updates');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data.type, data);
    
    // Handle different message types
    switch(data.type) {
        case 'connection_established':
            console.log('Connected as:', data.message);
            break;
        case 'attendance_update':
            console.log('Instructor checked in/out:', data.data);
            break;
        case 'attendance_rated':
            console.log('Attendance rated:', data.data);
            break;
        case 'summary_response':
            console.log('Today summary:', data.data);
            break;
    }
};

socket.onerror = function(error) {
    console.log('WebSocket error:', error);
};

// Request current summary
socket.send(JSON.stringify({ type: 'request_summary' }));

// Health check
socket.send(JSON.stringify({ type: 'ping' }));
```

**Events Received:**
- `connection_established` — Sent on successful connection
- `attendance_update` — Sent when instructor checks in
- `attendance_check_out` — Sent when instructor checks out
- `attendance_rated` — Sent when attendance is rated
- `summary_response` — Response to summary request
- `pong` — Response to ping

**WebSocket Close Codes:**
- `4001` — No token provided
- `4002` — Invalid token
- `4003` — Not authorized (not staff)

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

# Run enrollment API tests (107 tests)
dj test enrollments_payments.tests.test_api_enrollment_request \
       enrollments_payments.tests.test_api_admin_enrollment_request \
       enrollments_payments.tests.test_api_enrollment \
       enrollments_payments.tests.test_api_instructor_enrollment
```

---

## API Documentation

### Quick Reference

**Base URL:** `http://localhost:8000/api/`

#### Courses API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses/` | List all courses (with filters) | Required |
| GET | `/api/courses/{id}/` | Get course by ID or slug | Public |
| PUT/PATCH | `/api/courses/{id}/edit/` | Update course | Admin |
| GET | `/api/courses/landingpagecourses/` | Featured courses for landing page | Public |
| GET | `/api/courses/{id}/lectures/` | List course lectures | Required |
| POST | `/api/courses/{id}/lectures/` | Create additional lecture | Admin/Instructor |
| GET | `/api/courses/{id}/lectures/check-datetime/` | Check lecture availability | Required |
| PUT/PATCH | `/api/courses/lectures/{id}/edit/` | Update lecture | Admin/Instructor |
| GET | `/api/courses/{id}/ratings/` | Get course ratings | Required |

#### Users API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/instructors/` | List all instructors | Required |
| GET | `/api/users/instructors/{id}/` | Get instructor details | Public |
| GET | `/api/users/landingpageinstructors/` | Featured instructors | Public |
| GET | `/api/users/students/` | List students | Admin |
| GET | `/api/users/parents/` | List parents | Admin |

#### Enrollment API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/enrollment-requests/` | Create enrollment request | Parent/Student |
| GET | `/api/enrollment-requests/my-requests/` | User's enrollment requests | Parent/Student |
| POST | `/api/enrollment-requests/{id}/cancel/` | Cancel request | Owner |
| GET | `/api/enrollment-requests/admin/` | List all requests | Admin |
| POST | `/api/enrollment-requests/{id}/approve/` | Approve request | Admin |
| POST | `/api/enrollment-requests/{id}/reject/` | Reject request | Admin |
| POST | `/api/enrollment-requests/bulk-approve/` | Bulk approve | Admin |
| GET | `/api/enrollments/my-enrollments/` | User's enrollments | Parent/Student |
| GET | `/api/enrollments/instructor/` | Instructor's course enrollments | Instructor |

#### Attendance API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/attendance/check-in/` | Fingerprint check-in | Device ID |
| POST | `/api/attendance/check-out/` | Fingerprint check-out | Device ID |
| GET | `/api/attendance/today/` | Today's attendance | Admin |
| GET | `/api/attendance/today/summary/` | Today's summary | Admin |
| POST | `/api/attendance/{id}/rate/` | Rate attendance | Admin |
| POST | `/api/attendance/{id}/manual-check-in/` | Manual check-in | Admin |
| POST | `/api/attendance/{id}/manual-check-out/` | Manual check-out | Admin |
| POST | `/api/attendance/{id}/mark-absent/` | Mark absent | Admin |
| GET | `/api/attendance/date/{YYYY-MM-DD}/` | Attendance by date | Admin |
| GET | `/api/attendance/instructor/{id}/` | Instructor history | Admin |
| GET/POST | `/api/attendance/devices/` | Device management | Admin |
| GET/POST | `/api/attendance/schedules/` | Schedule management | Admin |
| POST | `/api/attendance/lecture/{id}/mark/` | Mark lecture attendance | Required |

### Detailed Documentation

📚 **Full API Documentation:** [`docs/api_documentation.md`](docs/api_documentation.md)
- Courses API (list, detail, update, filters)
- Users API (students, instructors, parents)
- Complete request/response examples
- Filter parameters and ordering options

📚 **Authentication API Documentation:** [`users/docs/authentication.md`](users/docs/authentication.md)
- Complete request/response examples
- JavaScript/Axios code samples
- Token management best practices
- Error handling guide

📚 **Enrollment API Documentation:** [`docs/enrollment_api.md`](docs/enrollment_api.md)
- User enrollment request endpoints
- Admin enrollment management
- Permission matrix for all endpoints
- Test coverage details (107 tests)

📚 **Attendance API Documentation:** [`attendance/docs/api.md`](attendance/docs/api.md)
- Fingerprint device integration
- Instructor attendance management
- Manual check-in/check-out endpoints
- WebSocket real-time updates

---

## Cron Jobs

Configured using `django-crontab`:

| Schedule | Job | Description |
|----------|-----|-------------|
| Every Sunday at 00:05 AM | `generate_instructor_attendance_weekly` | Generates weekly instructor attendance records based on schedules and lectures |
| Daily at 11:59 PM | `mark_absent_daily` | Marks instructors as absent if they didn't check in |
| Daily at 00:01 AM | `mark_absent_for_yesterday` | Fallback job to mark yesterday's pending records as absent |
| Daily at 06:00 AM | `update_pending_to_not_started` | Logs today's expected attendance count |

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

## Instructor Attendance API

The instructor attendance system supports fingerprint device integration and admin dashboard.

### Base URL

```
/api/attendance/
```

### Main Endpoints

| Purpose | Method | Endpoint | Auth |
|---------|--------|----------|------|
| Fingerprint Check-in | POST | `/api/attendance/check-in/` | Device ID |
| Fingerprint Check-out | POST | `/api/attendance/check-out/` | Device ID |
| Today's Attendance | GET | `/api/attendance/today/` | Admin JWT |
| Today's Summary | GET | `/api/attendance/today/summary/` | Admin JWT |
| Rate Attendance | POST | `/api/attendance/{id}/rate/` | Admin JWT |
| Manual Check-in | POST | `/api/attendance/{id}/manual-check-in/` | Admin JWT |
| Manual Check-out | POST | `/api/attendance/{id}/manual-check-out/` | Admin JWT |
| Mark Absent | POST | `/api/attendance/{id}/mark-absent/` | Admin JWT |
| Attendance by Date | GET | `/api/attendance/date/{YYYY-MM-DD}/` | Admin JWT |
| Instructor History | GET | `/api/attendance/instructor/{id}/` | Admin JWT |
| Device Management | GET/POST | `/api/attendance/devices/` | Admin JWT |
| Schedule Management | GET/POST | `/api/attendance/schedules/` | Admin JWT |

📚 **Detailed API documentation:** [`attendance/docs/api.md`](attendance/docs/api.md)

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
