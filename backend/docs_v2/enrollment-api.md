# 📝 Enrollment API Documentation

Comprehensive documentation for enrollment requests, approvals, user enrollments, and instructor enrollment views.

---

## Table of Contents

1. [Overview](#overview)
2. [User Enrollment Request Endpoints](#user-enrollment-request-endpoints)
3. [Admin Enrollment Request Endpoints](#admin-enrollment-request-endpoints)
4. [User Enrollment Endpoints](#user-enrollment-endpoints)
5. [Instructor Enrollment Endpoints](#instructor-enrollment-endpoints)
6. [Enrollment Status Workflow](#enrollment-status-workflow)
7. [Quick Reference](#quick-reference)

---

## Overview

The Enrollment API manages course enrollments through a request → approval workflow.

| Role | Capabilities |
|------|-------------|
| **Parent** | Submit enrollment requests for their children, view children's enrollments |
| **Student** | Submit enrollment requests for themselves, view own enrollments |
| **Instructor** | View enrollments in courses they teach (no financial data) |
| **Supervisor** | View and manage enrollment requests (no bulk operations) |
| **Admin** | Full access including bulk operations |

---

## User Enrollment Request Endpoints

### Create Enrollment Request

| | |
|--|--|
| **URL** | `POST /api/enrollment-requests/` |
| **Auth** | ✅ Required (Parent or Student) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course` | integer | Yes | Course ID to enroll in |
| `child` | UUID | Conditional | Required if user is a parent |
| `price` | decimal | No | Requested price (defaults to course price) |
| `payment_method` | string | No | `cash`, `card`, `bank_transfer`, `instapay`, `vodafone_cash`, `other` |
| `notes` | string | No | Additional notes |

**Example (Parent):**

```json
{
  "course": 1,
  "child": "a5e86085-b111-46f2-9209-f07d1a9946d3",
  "price": "250.00",
  "payment_method": "vodafone_cash"
}
```

**Example (Student):**

```json
{
  "course": 2
}
```

**Response (201 Created)**

**Validation Rules:**
- Course must be active and have available capacity
- Child must belong to the requesting parent
- Participant must be eligible (age requirements, `for_adults` flag)
- No duplicate pending/processing requests allowed
- No existing active enrollment for the same course/participant

---

### List User's Enrollment Requests

| | |
|--|--|
| **URL** | `GET /api/enrollment-requests/my-requests/` |
| **Auth** | ✅ Required (Parent or Student) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `pending`, `processing`, `accepted`, `rejected`, `cancelled` |
| `child` | uuid | Filter by child ID (parents only) |
| `course` | integer | Filter by course ID |

**Example Response:**

```json
[
  {
    "id": "uuid",
    "course": { "id": 1, "name": "Test Course" },
    "child_id": "child-uuid",
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

| | |
|--|--|
| **URL** | `GET /api/enrollment-requests/{id}/` |
| **Auth** | ✅ Required (Owner, Admin, or Supervisor) |

**Response (200 OK):**

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

| | |
|--|--|
| **URL** | `DELETE /api/enrollment-requests/{id}/cancel/` |
| **Auth** | ✅ Required (Owner only) |

**Restrictions:** Only `pending` or `processing` requests can be cancelled.

**Response (200 OK):**

```json
{
  "detail": "تم إلغاء طلب الإلتحاق.",
  "request_id": "uuid",
  "status": "cancelled"
}
```

---

## Admin Enrollment Request Endpoints

### List All Enrollment Requests

| | |
|--|--|
| **URL** | `GET /api/admin/enrollment-requests/` |
| **Auth** | ✅ Required (Admin or Supervisor) |

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
| `ordering` | string | `created_at`, `-created_at`, `expires_at`, `price` |

---

### View Enrollment Request Details (Admin)

| | |
|--|--|
| **URL** | `GET /api/admin/enrollment-requests/{id}/` |
| **Auth** | ✅ Required (Admin or Supervisor) |

---

### Update Enrollment Request

| | |
|--|--|
| **URL** | `PATCH /api/admin/enrollment-requests/{id}/update/` |
| **Auth** | ✅ Required (Admin or Supervisor) |

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New status (limited transitions) |
| `price` | decimal | Updated price |
| `payment_method` | string | Updated payment method |
| `notes` | string | Updated notes |

---

### Approve Enrollment Request

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/{id}/approve/` |
| **Auth** | ✅ Required (Admin or Supervisor) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_amount` | decimal | No | Amount paid (can be partial) |
| `payment_method` | string | No | Payment method |
| `notes` | string | No | Additional notes |

**Response (200 OK):**

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

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/{id}/reject/` |
| **Auth** | ✅ Required (Admin or Supervisor) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Rejection reason (min 5 characters) |

**Response (200 OK):**

```json
{
  "detail": "تم رفض طلب الإلتحاق.",
  "request_id": "uuid",
  "status": "rejected"
}
```

---

### Bulk Approve Enrollment Requests

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/bulk-approve/` |
| **Auth** | ✅ Required (**Admin only** — not Supervisor) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_ids` | UUID[] | Yes | List of request IDs (max 50) |
| `payment_method` | string | No | Default payment method |

**Response (200 OK):**

```json
{
  "approved_count": 5,
  "failed_count": 0,
  "skipped_count": 1,
  "approved": [{ "id": "uuid", "enrollment_id": "uuid" }],
  "failed": [],
  "skipped": [{ "id": "uuid", "reason": "Invalid status" }]
}
```

---

### Bulk Reject Enrollment Requests

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/bulk-reject/` |
| **Auth** | ✅ Required (**Admin only** — not Supervisor) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_ids` | UUID[] | Yes | List of request IDs (max 50) |
| `reason` | string | Yes | Rejection reason (min 5 characters) |

**Response (200 OK):**

```json
{
  "rejected_count": 3,
  "skipped_count": 1,
  "rejected": [{ "id": "uuid" }],
  "skipped": [{ "id": "uuid", "reason": "Already accepted" }]
}
```

---

## User Enrollment Endpoints

### List User's Enrollments

| | |
|--|--|
| **URL** | `GET /api/enrollments/my-enrollments/` |
| **Auth** | ✅ Required (Parent or Student) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `active`, `suspended`, `completed`, `dropped` |
| `child` | uuid | Filter by child ID (parents only) |
| `course` | integer | Filter by course ID |

**Example Response:**

```json
[
  {
    "id": "uuid",
    "course": {
      "id": 1,
      "name": "Test Course",
      "instructor_name": "John Doe"
    },
    "child_id": "child-uuid",
    "participant_name": "Test Child",
    "status": "active",
    "enrolled_at": "2025-02-10T12:00:00Z"
  }
]
```

---

### View Enrollment Details

| | |
|--|--|
| **URL** | `GET /api/enrollments/{id}/` |
| **Auth** | ✅ Required (Owner, Course Instructor, Admin, or Supervisor) |

---

### View Enrollment Progress

| | |
|--|--|
| **URL** | `GET /api/enrollments/{id}/progress/` |
| **Auth** | ✅ Required (Owner, Course Instructor, Admin, or Supervisor) |

**Example Response:**

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

> **Note:** Financial data (payments, amounts) is NOT exposed to instructors.

### List All Instructor Enrollments

| | |
|--|--|
| **URL** | `GET /api/instructor/enrollments/` |
| **Auth** | ✅ Required (Instructor) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `course_id` | integer | Filter by specific course |

---

### List Course Enrollments

| | |
|--|--|
| **URL** | `GET /api/instructor/courses/{course_id}/enrollments/` |
| **Auth** | ✅ Required (Instructor — own courses only) |

---

### Get Course Enrollment Statistics

| | |
|--|--|
| **URL** | `GET /api/instructor/courses/{course_id}/enrollment-stats/` |
| **Auth** | ✅ Required (Instructor — own courses only) |

**Example Response:**

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

> **Note:** Financial data (revenue, payments) is NOT exposed to instructors.

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

## Error Handling

**Validation Errors (400):**

```json
{
  "course": ["هذه الدورة غير متاحة حالياً."],
  "child": ["الطفل المحدد لا ينتمي إلى هذا المستخدم."]
}
```

**Permission Errors (403):**

```json
{
  "detail": "ليس لديك صلاحية للقيام بهذا الإجراء."
}
```

**Not Found Errors (404):**

```json
{
  "detail": "طلب الإلتحاق غير موجود."
}
```

---

## Notes

1. **UUID vs Integer IDs**: User-related models use UUID primary keys; Course-related models use integer primary keys
2. **Participant Types**: Enrollments can be for either a `child` (linked to parent) or a `student` (adult)
3. **Financial Privacy**: Only Admin and Supervisor roles can see financial information
4. **Bulk Operations**: Limited to Admin role only (not Supervisor), maximum 50 requests per operation
5. **Request Expiration**: Enrollment requests have an `expires_at` field (typically 7 days from creation)

---

## Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/enrollment-requests/` | Create request | Parent/Student |
| GET | `/api/enrollment-requests/my-requests/` | List user's requests | Parent/Student |
| GET | `/api/enrollment-requests/{id}/` | Request details | Owner/Admin/Sup |
| DELETE | `/api/enrollment-requests/{id}/cancel/` | Cancel request | Owner |
| GET | `/api/admin/enrollment-requests/` | List all requests | Admin/Supervisor |
| GET | `/api/admin/enrollment-requests/{id}/` | Request details | Admin/Supervisor |
| PATCH | `/api/admin/enrollment-requests/{id}/update/` | Update request | Admin/Supervisor |
| POST | `/api/admin/enrollment-requests/{id}/approve/` | Approve request | Admin/Supervisor |
| POST | `/api/admin/enrollment-requests/{id}/reject/` | Reject request | Admin/Supervisor |
| POST | `/api/admin/enrollment-requests/bulk-approve/` | Bulk approve | Admin only |
| POST | `/api/admin/enrollment-requests/bulk-reject/` | Bulk reject | Admin only |
| GET | `/api/enrollments/my-enrollments/` | List enrollments | Parent/Student |
| GET | `/api/enrollments/{id}/` | Enrollment details | Owner/Instructor/Admin |
| GET | `/api/enrollments/{id}/progress/` | Progress | Owner/Instructor/Admin |
| GET | `/api/instructor/enrollments/` | Instructor enrollments | Instructor |
| GET | `/api/instructor/courses/{id}/enrollments/` | Course enrollments | Instructor |
| GET | `/api/instructor/courses/{id}/enrollment-stats/` | Enrollment stats | Instructor |
