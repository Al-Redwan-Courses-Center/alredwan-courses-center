# API Documentation - Alredwan Courses Center

## Base URL
```
http://localhost:8000/api
```

---

## Table of Contents
1. [Courses Endpoints](../courses/docs/courses_api.md)
2. [Lecture Endpoints](../courses/docs/lectures_api.md)
3. [Users Endpoints](../users/docs/users_api.md)
4. [Parents & Childreen Endpoints](../parents/docs/parent_api.md)
5. [Attendance Endpoints](../attendance/docs/attendance_api.md)
6. [Enrollment Endpoints](../enrollments_payments/docs/enrollment_api.md)
7. [Response Format](#response-format)
8. [Error Handling](#error-handling)

---

## API Documentation by Module

This documentation is organized by application module. Each module has its own detailed documentation:

### 📚 Courses API
Complete documentation for course-related endpoints including listing, filtering, and lecture management.

👉 **[View Courses API Documentation](../courses/docs/courses_api.md)**

**Endpoints:**
- `GET /api/courses/` - List all courses with advanced filtering
- `GET /api/courses/{id}/` - Get course details by ID or slug
- `GET /api/courses/landingpagecourses/` - Get featured courses for landing page
- `GET /api/courses/{course_id}/lectures/` - List course lectures

---

### 👥 Users API
Complete documentation for user authentication, registration, and profile management.

👉 **[View Users API Documentation](../users/docs/users_api.md)**

**Endpoints:**
- User registration and authentication
- Profile management
- Password reset
- User roles and permissions

---

### ✅ Attendance API
Complete documentation for attendance tracking and management.

👉 **[View Attendance API Documentation](../attendance/docs/attendance_api.md)**

**Endpoints:**
- `POST /api/attendance/lecture/<lecture_id>/mark/` - Mark single attendance
- `POST /api/attendance/lecture/<lecture_id>/mark-bulk/` - Mark bulk attendance

---

## Response Format

### Success Response
All successful API responses follow this general structure:

```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

### Error Response
All error responses follow this structure:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": {
    // Detailed field errors if applicable
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 OK | Request succeeded |
| 201 Created | Resource created successfully |
| 204 No Content | Request succeeded with no content to return |
| 207 Multi-Status | Bulk operation completed with partial success |
| 400 Bad Request | Invalid request parameters or validation errors |
| 401 Unauthorized | Authentication required or failed |
| 403 Forbidden | Authenticated but not authorized to access resource |
| 404 Not Found | Resource not found |
| 500 Internal Server Error | Server error |

### Common Error Responses

**Validation Error (400):**
```json
{
  "field_name": [
    "This field is required."
  ],
  "another_field": [
    "Ensure this value is less than or equal to 10."
  ]
}
```

**Authentication Error (401):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Permission Error (403):**
```json
{
  "error": "You do not have permission to perform this action."
}
```

**Not Found Error (404):**
```json
{
  "error": "Resource not found."
}
```

---

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

### Header Format
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Example Request
```bash
curl -X GET "http://localhost:8000/api/courses/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 20 | Number of items per page |

**Example:**
```bash
GET /api/courses/?page=2&page_size=10
```

**Response:**
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/courses/?page=3&page_size=10",
  "previous": "http://localhost:8000/api/courses/?page=1&page_size=10",
  "results": [
    // Array of results
  ]
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

---

## Versioning

The API is currently at version 1. Future versions will be accessible via URL versioning:

```
http://localhost:8000/api/v1/courses/
http://localhost:8000/api/v2/courses/
```

---

## Support

For API support and questions:
- **Email**: support@alredwancourses.com
- **Documentation Issues**: Open an issue in the project repository

---

**Last Updated:** February 11, 2026
