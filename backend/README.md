# Redwan Courses Center – Backend

Backend system for **Redwan Courses Center** (واحة الرضوان), built with **Django 5**, **Django REST Framework**, **JWT authentication (Djoser)**, **PostgreSQL**, **Docker**, and **Channels**.

This project is **Docker-first**. All development and management commands must be executed inside Docker containers.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure-high-level)
- [Data Models Overview](#data-models-overview)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project-team-standard)
- [Django Commands Policy](#-important-django-commands-policy-read-this)
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
.
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
├── requirements.txt
├── manage.py
└── README.md
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

---

## Running the Project (Team Standard)

### 1️⃣ Build and start containers

```bash
docker compose up --build
```

This will:

* Start PostgreSQL
* Apply migrations
* Collect static files
* Run Django development server on `http://localhost:8000`

---

## 🚨 Important: Django Commands Policy (READ THIS)

This project is **Docker-only**.

### ❌ Do NOT run Django commands on your local machine:

```bash
python3 manage.py makemigrations
```

### ✅ Always run Django commands inside the container:

```bash
docker compose exec django-web-app python3 manage.py makemigrations
docker compose exec django-web-app python3 manage.py migrate
docker compose exec django-web-app python3 manage.py createsuperuser
docker compose exec django-web-app python3 manage.py shell
```

### Optional (Recommended Alias)

Add this to your shell config:

```bash
alias dj="docker compose exec django-web-app python3 manage.py"
```

Then use:

```bash
dj makemigrations
dj migrate
dj createsuperuser
```

---

## Admin Panel

Admin panel is available at:

```
http://localhost:8000/courses-admin/
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

## Database Migrations

Migrations are already included in the repository.

For new changes:

```bash
dj makemigrations
dj migrate
```

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

### ❌ `django.core.exceptions.ImproperlyConfigured: SECRET_KEY must not be empty`

✔ Solution:

* Ensure `.env` exists
* Ensure `DJANGO_SECRET_KEY` is set
* Restart containers
* Run migrations again BUT inside Docker container

---

## Team Rules (Non-Negotiable)

* Docker is the single source of truth
* No local Python execution
* No direct DB schema changes
* All migrations committed (Abo Al-layl request)
* API is the contract with frontend

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

```bash
# Start containers
docker compose up --build

# Stop containers
docker compose down

# View logs
docker compose logs -f django-web-app

# Django shell
dj shell

# Create superuser
dj createsuperuser

# Make migrations
dj makemigrations

# Apply migrations
dj migrate

# Collect static files
dj collectstatic

# Run tests
dj test

# Check for issues
dj check
```

---
