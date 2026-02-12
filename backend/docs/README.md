# 📚 Alredwan Courses Center — API Documentation

Welcome! This is the **single source of truth** for the backend API. Everything the frontend team needs is here.

---

## 🗂️ Documentation Index

### For Frontend Developers

| Document | Description |
|----------|-------------|
| [🔐 Authentication](./authentication.md) | Login, register, JWT tokens, password management |
| [📖 Courses API](./courses-api.md) | List/search courses, lectures, landing page endpoints |
| [📝 Enrollment & Payments API](./enrollment-api.md) | Enrollment requests, approvals, payments, refunds |
| [📋 Attendance API](./attendance-api.md) | Instructor & student attendance, fingerprint devices |
| [🔌 WebSocket (Real-time)](./websocket.md) | Live attendance updates for admin dashboard |

### For Backend Developers (Internal)

| Document | Description |
|----------|-------------|
| [⚙️ Signals & Lecture Generation](./internal/signals-and-lecture-generation.md) | How lectures are auto-generated from schedules |
| [⚙️ Attendance System Logic](./internal/attendance-system-logic.md) | Business rules, cron jobs, rating system internals |

---

## 🌐 Base URLs

| Environment | Base URL |
|-------------|----------|
| Local | `http://localhost:8000` |
| Production | `https://<your-app>.onrender.com` |

### API Prefixes

| Module | Prefix |
|--------|--------|
| Authentication | `/auth/` |
| Courses | `/api/courses/` |
| Users / Instructors | `/api/users/` |
| Enrollments & Payments | `/api/` |
| Attendance | `/api/attendance/` |
| Admin Panel | `/Al-Redwan-superadmin-dashboard/` |

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

See [Authentication docs](./authentication.md) for full details.

---

## 👥 Role Permissions Overview

| Role | What they can do |
|------|-----------------|
| **Student** | Browse courses, enroll, view own enrollments |
| **Parent** | Enroll children, view children's enrollments |
| **Instructor** | View their course enrollments (no financial data) |
| **Supervisor** | Manage enrollment requests, view reports |
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
