# 📚 Alredwan Courses Center — API Documentation

Welcome! This is the **single source of truth** for the backend API. Everything the frontend team needs is here.

---

## 🗂️ Documentation Index

### For Frontend Developers

| Document | Description |
|----------|-------------|
| [🔐 Authentication](authentication.md) | Login, register, JWT tokens, password management |
| [📖 Courses & Lectures API](courses-api.md) | Courses, lectures, schedules, landing page, ratings |
| [👤 Users & Instructors API](users-api.md) | Instructor listing, details, ratings, landing page |
| [👨‍👩‍👧 Parents API](parents-api.md) | Child management (create, list, update, delete) |
| [📝 Enrollment API](enrollment-api.md) | Enrollment requests, approvals, user & instructor enrollments |
| [📋 Attendance API](attendance-api.md) | Instructor & student attendance, fingerprint devices, ratings |
| [🔌 WebSocket (Real-time)](websocket.md) | Live attendance updates for admin dashboard |

### For Backend Developers (Internal)

| Document | Description |
|----------|-------------|
| [⚙️ Signals & Lecture Generation](internal/signals-and-lecture-generation.md) | How lectures are auto-generated from schedules |
| [⚙️ Attendance System Logic](internal/attendance-system-logic.md) | Business rules, cron jobs, rating system internals |

### DevOps & Deployment

| Document | Description |
|----------|-------------|
| [🚀 Production Checklist](PRODUCTION_CHECKLIST.md) | Complete guide for production deployment |
| [📊 Excel Export Guide](EXCEL_EXPORT_GUIDE.md) | Adding Excel export to Django admin models |

---

## 🌐 Base URLs

| Environment | Base URL (HTTP) | WebSocket URL |
|-------------|-----------------|---------------|
| Local | `http://localhost:8000` | `ws://localhost:8001` |
| Production | `https://<your-domain>` | `wss://<your-domain>:8001` |

### Server Ports

| Port | Server | Purpose |
|------|--------|---------|
| 8000 | Gunicorn (WSGI) | HTTP/REST API |
| 8001 | Uvicorn (ASGI) | WebSocket connections |

### API Prefixes

| Module | Prefix |
|--------|--------|
| Authentication | `/auth/` |
| Courses & Lectures | `/api/courses/` |
| Users & Instructors | `/api/users/` |
| Parents & Children | `/api/parents/` |
| Enrollment Requests | `/api/enrollment-requests/` |
| Enrollments | `/api/enrollments/` |
| Admin Enrollment Mgmt | `/api/admin/enrollment-requests/` |
| Instructor Enrollments | `/api/instructor/` |
| Attendance | `/api/attendance/` |
| Admin Panel | `/Al-Redwan-superadmin-dashboard/` |
| Health Check | `/health/` |

---

## 🔑 Authentication Quick Start

All protected endpoints require a JWT token:

```
Authorization: JWT <access_token>
```

> ⚠️ Use `JWT` prefix, **not** `Bearer`.

```bash
# 1. Register
POST /auth/users/

# 2. Login → get tokens
POST /auth/jwt/create/

# 3. Use the access token in all requests
GET /api/courses/ -H "Authorization: JWT eyJ..."

# 4. Refresh when expired
POST /auth/jwt/refresh/
```

See [Authentication docs](authentication.md) for full details.

---

## 👥 Role Permissions Overview

| Role | What they can do |
|------|-----------------|
| **Student** | Browse courses, enroll, view own enrollments |
| **Parent** | Enroll children, manage children, view children's enrollments |
| **Instructor** | View their course enrollments (no financial data), manage lectures |
| **Supervisor** | Manage enrollment requests, view reports, manage lectures |
| **Admin** | Full access to everything |

---

## 📱 Phone Number Format

Always use **E.164 international format**:

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `01234567890` | `+201234567890` |
| `(02) 1234-5678` | `+20212345678` |

---

## 📊 Common Response Patterns

### Pagination
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/courses/?page=2",
  "previous": null,
  "results": [...]
}
```

### Error Responses
```json
{
  "field_name": ["Error message"],
  "non_field_errors": ["General error"],
  "detail": "Single error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | Success, no content |
| `400` | Validation error |
| `401` | Not authenticated |
| `403` | No permission |
| `404` | Not found |

---

## 📋 Complete Endpoint Reference

### Authentication (`/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/users/` | Register |
| POST | `/auth/jwt/create/` | Login |
| POST | `/auth/jwt/refresh/` | Refresh token |
| POST | `/auth/jwt/verify/` | Verify token |
| GET | `/auth/users/me/` | Get profile |
| PUT/PATCH | `/auth/users/me/` | Update profile |
| DELETE | `/auth/users/me/` | Delete account |
| POST | `/auth/users/set_password/` | Change password |

### Courses & Lectures (`/api/courses/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/` | List all courses |
| GET | `/api/courses/{id_or_slug}/` | Get course details |
| PUT/PATCH | `/api/courses/{id}/edit/` | Update course |
| GET | `/api/courses/{id_or_slug}/ratings/` | Get course ratings |
| GET | `/api/courses/landingpagecourses/` | Landing page courses |
| GET/POST | `/api/courses/{course_id}/lectures/` | List/create lectures |
| GET | `/api/courses/{course_id}/lectures/check-datetime/` | Check lecture availability |
| GET | `/api/courses/lectures/{id}/` | Get lecture details |
| PUT/PATCH | `/api/courses/lectures/{id}/edit/` | Update lecture |
| GET | `/api/courses/lectures/today/` | Today's lectures |

### Users & Instructors (`/api/users/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/instructors/` | List instructors |
| GET | `/api/users/instructors/{id}/` | Instructor details |
| GET | `/api/users/instructors/{id}/ratings/` | Instructor ratings |
| GET | `/api/users/landingpageinstructors/` | Landing page instructors |

### Parents & Children (`/api/parents/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parents/children/` | List children |
| POST | `/api/parents/children/create/` | Create child |
| GET | `/api/parents/children/{id}/` | Child details |
| PUT/PATCH | `/api/parents/children/{id}/update/` | Update child |
| DELETE | `/api/parents/children/{id}/delete/` | Delete child |

### Enrollment Requests (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enrollment-requests/` | Create request |
| GET | `/api/enrollment-requests/my-requests/` | List user's requests |
| GET | `/api/enrollment-requests/{id}/` | Request details |
| DELETE | `/api/enrollment-requests/{id}/cancel/` | Cancel request |
| GET | `/api/admin/enrollment-requests/` | List all (admin) |
| GET | `/api/admin/enrollment-requests/{id}/` | Details (admin) |
| PATCH | `/api/admin/enrollment-requests/{id}/update/` | Update (admin) |
| POST | `/api/admin/enrollment-requests/{id}/approve/` | Approve |
| POST | `/api/admin/enrollment-requests/{id}/reject/` | Reject |
| POST | `/api/admin/enrollment-requests/bulk-approve/` | Bulk approve |
| POST | `/api/admin/enrollment-requests/bulk-reject/` | Bulk reject |

### Enrollments (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enrollments/my-enrollments/` | List user's enrollments |
| GET | `/api/enrollments/{id}/` | Enrollment details |
| GET | `/api/enrollments/{id}/progress/` | Enrollment progress |
| GET | `/api/instructor/enrollments/` | Instructor's enrollments |
| GET | `/api/instructor/courses/{course_id}/enrollments/` | Course enrollments |
| GET | `/api/instructor/courses/{course_id}/enrollment-stats/` | Enrollment stats |

### Attendance (`/api/attendance/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/scan/` | Unified fingerprint scan |
| POST | `/api/attendance/check-in/` | Fingerprint check-in (legacy) |
| POST | `/api/attendance/check-out/` | Fingerprint check-out (legacy) |
| GET | `/api/attendance/today/` | Today's attendance |
| GET | `/api/attendance/today/summary/` | Today's summary |
| GET | `/api/attendance/date/{YYYY-MM-DD}/` | Attendance by date |
| GET/PUT/PATCH | `/api/attendance/{id}/` | Attendance detail / update |
| POST | `/api/attendance/{id}/rate/` | Rate attendance |
| POST | `/api/attendance/{id}/manual-check-in/` | Manual check-in |
| POST | `/api/attendance/{id}/manual-check-out/` | Manual check-out |
| POST | `/api/attendance/{id}/mark-absent/` | Mark absent |
| GET | `/api/attendance/instructor/{id}/` | Instructor history |
| GET/POST | `/api/attendance/devices/` | Device management |
| GET/PATCH/DELETE | `/api/attendance/devices/{id}/` | Device detail |
| GET/POST | `/api/attendance/schedules/` | Schedule management |
| GET/PATCH/DELETE | `/api/attendance/schedules/{id}/` | Schedule detail |
| POST | `/api/attendance/lecture/{id}/mark/` | Mark lecture attendance |
| POST | `/api/attendance/lecture/{id}/mark-bulk/` | Bulk mark attendance |
| GET | `/api/attendance/lecture/{id}/details/` | Lecture attendance details |

### WebSocket

| Protocol | URL | Description |
|----------|-----|-------------|
| WS | `ws://host:8001/ws/attendance/?token=<jwt>` | Live attendance updates |
