# Enrollment API Documentation

This document provides comprehensive documentation for the Enrollment API endpoints in the Alredwan Courses Center system.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Enrollment Request Endpoints](#user-enrollment-request-endpoints)
4. [Admin Enrollment Request Endpoints](#admin-enrollment-request-endpoints)
5. [User Enrollment Endpoints](#user-enrollment-endpoints)
6. [Instructor Enrollment Endpoints](#instructor-enrollment-endpoints)
7. [Response Codes](#response-codes)
8. [Error Handling](#error-handling)

---

## Overview

The Enrollment API provides endpoints for managing course enrollments in the Alredwan Courses Center. The system supports multiple user roles with different access levels:

| Role | Description |
|------|-------------|
| **Parent** | Can submit enrollment requests for their children, view their children's enrollments |
| **Student** | Can submit enrollment requests for themselves, view their own enrollments |
| **Instructor** | Can view enrollments in courses they teach |
| **Supervisor** | Can view and manage enrollment requests (cannot bulk operations) |
| **Admin** | Full access to all enrollment management including bulk operations |

---

## Authentication

All endpoints require JWT token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## User Enrollment Request Endpoints

These endpoints are for parents and students to manage their own enrollment requests.

### Create Enrollment Request

Create a new enrollment request for a course.

**Endpoint:** `POST /api/enrollment-requests/`

**Permissions:** Parent, Student

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course` | integer | Yes | Course ID to enroll in |
| `child` | UUID | Conditional | Required if user is a parent; Child UUID to enroll |
| `price` | decimal | No | Requested price (partial payment), defaults to course price |
| `payment_method` | string | No | Payment method: `cash`, `card`, `bank_transfer`, `instapay`, `vodafone_cash`, `other` |
| `notes` | string | No | Additional notes |

**Example Request (Parent):**
```json
{
    "course": 1,
    "child": "a5e86085-b111-46f2-9209-f07d1a9946d3",
    "price": "250.00",
    "payment_method": "vodafone_cash"
}
```

**Example Request (Student):**
```json
{
    "course": 2
}
```

**Response:** `201 Created`

**Validation Rules:**
- Course must be active and have available capacity
- Child must belong to the requesting parent
- Participant must be eligible for the course (age requirements, for_adults flag)
- No duplicate pending/processing requests allowed
- No existing active enrollment for the same course/participant

---

### List User's Enrollment Requests

Get a list of the user's own enrollment requests.

**Endpoint:** `GET /api/enrollment-requests/my-requests/`

**Permissions:** Parent, Student

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `processing`, `accepted`, `rejected`, `cancelled` |
| `course` | integer | Filter by course ID |

**Response:** `200 OK`
```json
[
    {
        "id": "uuid",
        "course": {
            "id": 1,
            "name": "Test Course"
        },
        "participant_name": "Test Child",
        "participant_type": "child",
        "status": "pending",
        "price": "500.00",
        "payment_method": "cash",
        "created_at": "2025-02-10T12:00:00Z",
        "expires_at": "2025-02-17T12:00:00Z"
    }
]
```

---

### View Enrollment Request Details

Get details of a specific enrollment request.

**Endpoint:** `GET /api/enrollment-requests/{id}/`

**Permissions:** 
- Owner (parent/student who created the request)
- Admin, Supervisor

**Response:** `200 OK`
```json
{
    "id": "uuid",
    "course": {
        "id": 1,
        "name": "Test Course",
        "start_date": "2025-02-10",
        "end_date": "2025-04-10",
        "price": "500.00"
    },
    "participant_name": "Test Child",
    "participant_type": "child",
    "status": "pending",
    "price": "500.00",
    "payment_method": "cash",
    "notes": null,
    "created_at": "2025-02-10T12:00:00Z",
    "expires_at": "2025-02-17T12:00:00Z"
}
```

---

### Cancel Enrollment Request

Cancel a pending enrollment request.

**Endpoint:** `DELETE /api/enrollment-requests/{id}/cancel/`

**Permissions:** Owner (parent/student who created the request)

**Restrictions:**
- Only `pending` or `processing` requests can be cancelled
- Admin/Supervisor should use the reject endpoint instead

**Response:** `200 OK`
```json
{
    "detail": "تم إلغاء طلب الإلتحاق.",
    "request_id": "uuid",
    "status": "cancelled"
}
```

---

## Admin Enrollment Request Endpoints

These endpoints are for admins and supervisors to manage all enrollment requests.

### List All Enrollment Requests

Get a list of all enrollment requests with advanced filtering.

**Endpoint:** `GET /api/admin/enrollment-requests/`

**Permissions:** Admin, Supervisor

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `course_id` | integer | Filter by course ID |
| `season_id` | integer | Filter by season ID |
| `parent_id` | UUID | Filter by parent ID |
| `student_id` | UUID | Filter by student ID |
| `date_from` | date | Filter by creation date (from) |
| `date_to` | date | Filter by creation date (to) |
| `ordering` | string | Order by: `created_at`, `-created_at`, `expires_at`, `price` |

**Response:** `200 OK`

---

### View Enrollment Request Details (Admin)

Get detailed information about any enrollment request.

**Endpoint:** `GET /api/admin/enrollment-requests/{id}/`

**Permissions:** Admin, Supervisor

**Response:** `200 OK`

---

### Update Enrollment Request

Update an enrollment request's details.

**Endpoint:** `PATCH /api/admin/enrollment-requests/{id}/update/`

**Permissions:** Admin, Supervisor

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New status (limited transitions) |
| `price` | decimal | Updated price |
| `payment_method` | string | Updated payment method |
| `notes` | string | Updated notes |

**Response:** `200 OK`

---

### Approve Enrollment Request

Approve an enrollment request and create an enrollment.

**Endpoint:** `POST /api/admin/enrollment-requests/{id}/approve/`

**Permissions:** Admin, Supervisor

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_amount` | decimal | No | Amount paid (can be partial) |
| `payment_method` | string | No | Payment method |
| `notes` | string | No | Additional notes |

**Response:** `200 OK`
```json
{
    "detail": "تم قبول طلب الإلتحاق وإنشاء التسجيل.",
    "request_id": "uuid",
    "enrollment_id": "uuid"
}
```

**Side Effects:**
- Creates a new `Enrollment` record with status `ACTIVE`
- Creates a `Payment` record if `payment_amount` is provided
- Updates the enrollment request status to `ACCEPTED`

---

### Reject Enrollment Request

Reject an enrollment request.

**Endpoint:** `POST /api/admin/enrollment-requests/{id}/reject/`

**Permissions:** Admin, Supervisor

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Rejection reason (min 5 characters) |

**Response:** `200 OK`
```json
{
    "detail": "تم رفض طلب الإلتحاق.",
    "request_id": "uuid",
    "status": "rejected"
}
```

---

### Bulk Approve Enrollment Requests

Approve multiple enrollment requests at once.

**Endpoint:** `POST /api/admin/enrollment-requests/bulk-approve/`

**Permissions:** Admin only

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_ids` | UUID[] | Yes | List of request IDs to approve (max 50) |
| `payment_method` | string | No | Default payment method |

**Response:** `200 OK`
```json
{
    "approved_count": 5,
    "failed_count": 0,
    "skipped_count": 1,
    "approved": [{"id": "uuid", "enrollment_id": "uuid"}],
    "failed": [],
    "skipped": [{"id": "uuid", "reason": "Invalid status"}]
}
```

---

### Bulk Reject Enrollment Requests

Reject multiple enrollment requests at once.

**Endpoint:** `POST /api/admin/enrollment-requests/bulk-reject/`

**Permissions:** Admin only

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_ids` | UUID[] | Yes | List of request IDs to reject (max 50) |
| `reason` | string | Yes | Rejection reason (min 5 characters) |

**Response:** `200 OK`
```json
{
    "rejected_count": 3,
    "skipped_count": 1,
    "rejected": [{"id": "uuid"}],
    "skipped": [{"id": "uuid", "reason": "Already accepted"}]
}
```

---

## User Enrollment Endpoints

These endpoints are for parents and students to view their enrollments.

### List User's Enrollments

Get a list of the user's enrollments.

**Endpoint:** `GET /api/enrollments/my-enrollments/`

**Permissions:** Parent, Student

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `active`, `suspended`, `completed`, `dropped` |
| `course` | integer | Filter by course ID |

**Response:** `200 OK`
```json
[
    {
        "id": "uuid",
        "course": {
            "id": 1,
            "name": "Test Course",
            "instructor_name": "John Doe"
        },
        "participant_name": "Test Child",
        "status": "active",
        "enrolled_at": "2025-02-10T12:00:00Z"
    }
]
```

---

### View Enrollment Details

Get details of a specific enrollment.

**Endpoint:** `GET /api/enrollments/{id}/`

**Permissions:** 
- Owner (parent/student whose enrollment it is)
- Course Instructor
- Admin, Supervisor

**Response:** `200 OK`

---

### View Enrollment Progress

Get completion progress for an enrollment.

**Endpoint:** `GET /api/enrollments/{id}/progress/`

**Permissions:** 
- Owner (parent/student whose enrollment it is)
- Course Instructor
- Admin, Supervisor

**Response:** `200 OK`
```json
{
    "total_lectures": 20,
    "expected_lectures": 10,
    "completed_lectures": 8,
    "percentage": 80.0,
    "end_date_passed": false,
    "course_end_date": "2025-04-10",
    "is_completable": true
}
```

---

## Instructor Enrollment Endpoints

These endpoints are for instructors to view enrollments in their courses.

### List All Instructor Enrollments

Get a list of all enrollments across the instructor's courses.

**Endpoint:** `GET /api/instructor/enrollments/`

**Permissions:** Instructor

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `course_id` | integer | Filter by specific course |

**Response:** `200 OK`

**Note:** Financial data (payments, amounts) is NOT exposed to instructors.

---

### List Course Enrollments

Get a list of enrollments for a specific course.

**Endpoint:** `GET /api/instructor/courses/{course_id}/enrollments/`

**Permissions:** Instructor (only for their own courses)

**Response:** `200 OK`

---

### Get Course Enrollment Statistics

Get enrollment statistics for a specific course.

**Endpoint:** `GET /api/instructor/courses/{course_id}/enrollment-stats/`

**Permissions:** Instructor (only for their own courses)

**Response:** `200 OK`
```json
{
    "course_id": 1,
    "course_name": "Test Course",
    "capacity": 30,
    "enrolled_count": 25,
    "available_spots": 5,
    "active_students": 22,
    "suspended_students": 2,
    "completed_students": 1,
    "dropped_students": 0
}
```

**Note:** Financial data (revenue, payments) is NOT exposed to instructors.

---

## Response Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request (validation error) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `500` | Internal server error |

---

## Error Handling

### Validation Errors

Validation errors return a `400` status with details:

```json
{
    "course": ["هذه الدورة غير متاحة حالياً."],
    "child": ["الطفل المحدد لا ينتمي إلى هذا المستخدم."]
}
```

### Permission Errors

Permission errors return a `403` status:

```json
{
    "detail": "ليس لديك صلاحية للقيام بهذا الإجراء."
}
```

### Not Found Errors

Not found errors return a `404` status:

```json
{
    "detail": "طلب الإلتحاق غير موجود."
}
```

---

## Enrollment Status Workflow

```
EnrollmentRequest:
    PENDING → PROCESSING → ACCEPTED (creates Enrollment)
         ↓         ↓
    CANCELLED   REJECTED

Enrollment:
    ACTIVE → SUSPENDED → ACTIVE (can toggle)
       ↓
    COMPLETED or DROPPED
```

---

## Test Coverage

The API has comprehensive test coverage with 107 tests across the following test files:

| Test File | Tests | Description |
|-----------|-------|-------------|
| `test_api_enrollment_request.py` | 27 | User enrollment request endpoints |
| `test_api_admin_enrollment_request.py` | 35 | Admin enrollment request endpoints |
| `test_api_enrollment.py` | 23 | User enrollment endpoints |
| `test_api_instructor_enrollment.py` | 22 | Instructor enrollment endpoints |

To run the tests:

```bash
# Run all enrollment API tests
python manage.py test enrollments_payments.tests.test_api_enrollment_request \
                      enrollments_payments.tests.test_api_admin_enrollment_request \
                      enrollments_payments.tests.test_api_enrollment \
                      enrollments_payments.tests.test_api_instructor_enrollment

# Run with verbosity
python manage.py test enrollments_payments.tests -v 2
```

---

## Notes

1. **UUID vs Integer IDs**: 
   - User-related models (Parent, StudentUser, Child) use UUID primary keys
   - Course-related models (Course, Season) use integer primary keys

2. **Participant Types**:
   - Enrollments can be for either a `child` (linked to parent) or a `student` (adult student)
   - The `participant_name` and `participant_type` fields are computed based on which is set

3. **Financial Privacy**:
   - Instructors cannot see financial data (payments, amounts, balances)
   - Only Admin and Supervisor roles can see financial information

4. **Bulk Operations**:
   - Limited to Admin role only (not Supervisor)
   - Maximum 50 requests per bulk operation

5. **Request Expiration**:
   - Enrollment requests have an `expires_at` field (typically 7 days from creation)
   - Expired requests should be handled by a cron job
