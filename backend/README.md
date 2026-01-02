# Redwan Courses Center – Backend

Backend service for the **Redwan Courses Center** onsite web application.
Built with **Django**, **PostgreSQL**, **Docker**, **JWT authentication**, and **Channels**.

---

## Tech Stack

* Python 3.14
* Django 5.2
* PostgreSQL 17
* Django REST Framework
* Djoser + SimpleJWT
* Django Channels (Redis)
* Docker & Docker Compose

---

## Project Structure (Backend)

```
backend/
├── core/
├── users/
├── courses/
├── attendance/
├── enrollments_payments/
├── manage.py
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── requirements.txt
├── .env.example
└── README.md
```

---

## Environment Variables

Create a `.env` file in the backend root(or ask your team lead).

Example:

```env
DJANGO_SECRET_KEY=super-secret-key
DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

DATABASE_ENGINE=postgresql
DATABASE_NAME=redwan_db
DATABASE_USERNAME=redwan_user
DATABASE_PASSWORD=strongpassword
DATABASE_HOST=db
DATABASE_PORT=5432
```

---

## Running the Backend (Docker – Recommended)

### 1. Build and start services

```bash
docker compose up --build -d
```

This starts:

* Django backend
* PostgreSQL database
* pgAdmin (optional)

---

### 2. Run database migrations

```bash
docker compose exec django-web-app python manage.py makemigrations
docker compose exec django-web-app python manage.py migrate
```

---

### 3. Create a superuser (admin)

```bash
docker compose exec django-web-app python manage.py createsuperuser
```

---

### 4. Access the application

* Backend API:
  `http://localhost:8000`

* Django Admin:
  `http://localhost:8000/courses-admin/`

* pgAdmin:
  `http://localhost:5050`
  (email/password from `docker-compose.yml`)

---

## Common Docker Commands

### Stop containers

```bash
docker compose down
```

### Rebuild from scratch

```bash
docker compose down -v
docker compose up --build
```

### Clean unused Docker resources (optional)

```bash
docker system prune -a
```

---

## Running Without Docker (Not Recommended for Team)

> Use only if Docker is unavailable.

### 1. Create virtual environment

```bash
python3.10 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set environment variables manually

```bash
export DJANGO_SECRET_KEY=dev-key
export DEBUG=1
```

### 4. Run migrations and server

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

---

## Authentication & Admin

* Custom user model: `users.CustomUser`
* Authentication via JWT
* Admin panel path: `/courses-admin/`
* Arabic RTL admin UI supported

---

## Attendance Logic (High-Level)

* Attendance is created automatically for **future lectures** upon enrollment.
* Attendance cannot be submitted for future lectures.
* Ratings are required when submitting attendance.
* Once attendance is taken, lectures cannot be deleted.
* Past attendance is immutable for non-admins after 24 hours.

---

## Testing Checklist

* Create a course with past, present, and future lectures
* Enroll a student before a future lecture → attendance auto-created
* Attempt attendance submission:

  * Future lecture → 403
  * Missing rating → 400
* Submit valid attendance → lecture marked as taken
* Attempt lecture deletion after attendance → blocked
* Delete enrollment → future attendance removed, past preserved
* Verify `(lecture, student)` uniqueness constraint

---

## Notes for Contributors

* Always run management commands **inside Docker**
* Do not commit `.env`
* Update `requirements.txt` only when dependencies change
* Admin UI strings should remain Arabic-first

---
