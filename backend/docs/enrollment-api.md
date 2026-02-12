# 📝 Enrollment & Payments API

Complete enrollment lifecycle: requests → approvals → enrollments → payments → refunds.

---

## Table of Contents

1. [Enrollment Requests (User)](#enrollment-requests-user)
2. [Enrollment Requests (Admin)](#enrollment-requests-admin)
3. [Enrollments (User)](#enrollments-user)
4. [Enrollments (Admin)](#enrollments-admin)
5. [Enrollments (Instructor)](#enrollments-instructor)
6. [Payments](#payments)
7. [Refund Requests](#refund-requests)
8. [Status Workflows](#status-workflows)

---

## Enrollment Requests (User)

### Create Enrollment Request

| | |
|--|--|
| **URL** | `POST /api/enrollment-requests/` |
| **Auth** | ✅ Parent or Student |

**Request (Parent enrolling a child):**
```json
{
  "course": 1,
  "child": "a5e86085-b111-46f2-9209-f07d1a9946d3",
  "price": "250.00",
  "payment_method": "vodafone_cash"
}
```

**Request (Student self-enrolling):**
```json
{
  "course": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course` | integer | Yes | Course ID |
| `child` | UUID | If parent | Child UUID to enroll |
| `price` | decimal | No | Requested price (defaults to course price) |
| `payment_method` | string | No | `cash`, `card`, `bank_transfer`, `instapay`, `vodafone_cash`, `other` |
| `notes` | string | No | Additional notes |

**Validation Rules:**
- Course must be active with available capacity
- Child must belong to the requesting parent
- Participant must meet age requirements
- No duplicate pending requests or active enrollments

---

### List My Enrollment Requests

| | |
|--|--|
| **URL** | `GET /api/enrollment-requests/my-requests/` |
| **Auth** | ✅ Parent or Student |

**Filters:** `?status=pending`, `?course=1`

**Response:**
```json
[
  {
    "id": "uuid",
    "course": { "id": 1, "name": "Test Course" },
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

### View Request Details

| | |
|--|--|
| **URL** | `GET /api/enrollment-requests/{id}/` |
| **Auth** | ✅ Owner, Admin, or Supervisor |

---

### Cancel Request

| | |
|--|--|
| **URL** | `DELETE /api/enrollment-requests/{id}/cancel/` |
| **Auth** | ✅ Owner only |

Only `pending` or `processing` requests can be cancelled.

**Response:**
```json
{
  "detail": "تم إلغاء طلب الإلتحاق.",
  "request_id": "uuid",
  "status": "cancelled"
}
```

---

## Enrollment Requests (Admin)

### List All Requests

| | |
|--|--|
| **URL** | `GET /api/admin/enrollment-requests/` |
| **Auth** | ✅ Admin or Supervisor |

**Filters:** `status`, `course_id`, `season_id`, `parent_id`, `student_id`, `date_from`, `date_to`, `ordering`

---

### Update Request

| | |
|--|--|
| **URL** | `PATCH /api/admin/enrollment-requests/{id}/update/` |
| **Auth** | ✅ Admin or Supervisor |

Can update: `status`, `price`, `payment_method`, `notes`, `expires_at`

---

### Approve Request

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/{id}/approve/` |
| **Auth** | ✅ Admin or Supervisor |

```json
{
  "payment_amount": "500.00",
  "payment_method": "cash",
  "notes": "Paid in full"
}
```

**Side effects:**
- Creates `Enrollment` with status `ACTIVE`
- Creates `Payment` record if amount provided
- Updates request status to `ACCEPTED`

**Response:**
```json
{
  "detail": "تم قبول طلب الإلتحاق وإنشاء التسجيل.",
  "request_id": "uuid",
  "enrollment_id": "uuid"
}
```

---

### Reject Request

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/{id}/reject/` |
| **Auth** | ✅ Admin or Supervisor |

```json
{
  "reason": "Course is full for this age group"
}
```

---

### Bulk Approve

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/bulk-approve/` |
| **Auth** | ✅ Admin only |

```json
{
  "request_ids": ["uuid1", "uuid2"],
  "payment_method": "cash"
}
```

**Response:**
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

### Bulk Reject

| | |
|--|--|
| **URL** | `POST /api/admin/enrollment-requests/bulk-reject/` |
| **Auth** | ✅ Admin only |

```json
{
  "request_ids": ["uuid1", "uuid2"],
  "reason": "Season ended"
}
```

> ⚠️ Bulk operations: **Admin only**, max 50 per request.

---

## Enrollments (User)

### List My Enrollments

| | |
|--|--|
| **URL** | `GET /api/enrollments/my-enrollments/` |
| **Auth** | ✅ Parent or Student |

**Filters:** `?status=active`, `?course=1`

**Response:**
```json
[
  {
    "id": "uuid",
    "course": { "id": 1, "name": "Test Course", "instructor_name": "John Doe" },
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
| **Auth** | ✅ Owner, Instructor, Admin, or Supervisor |

---

### View Enrollment Progress

| | |
|--|--|
| **URL** | `GET /api/enrollments/{id}/progress/` |
| **Auth** | ✅ Owner, Instructor, Admin, or Supervisor |

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

## Enrollments (Admin)

### Admin Enrollment Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/enrollments/` | List all enrollments |
| POST | `/api/admin/enrollments/` | Create enrollment directly (bypass request flow) |
| PATCH | `/api/admin/enrollments/{id}/` | Update enrollment |
| POST | `/api/admin/enrollments/{id}/suspend/` | Suspend (requires `reason`) |
| POST | `/api/admin/enrollments/{id}/reactivate/` | Reactivate suspended |
| POST | `/api/admin/enrollments/{id}/drop/` | Drop enrollment (requires `reason`) |
| POST | `/api/admin/enrollments/{id}/complete/` | Manually complete |
| GET | `/api/admin/enrollments/completable/` | List auto-completable |
| POST | `/api/admin/enrollments/mark-completed/` | Bulk complete (Admin only) |

---

## Enrollments (Instructor)

> ⚠️ Instructors **cannot** see financial data (payments, amounts).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/enrollments/` | All enrollments across their courses |
| GET | `/api/instructor/courses/{course_id}/enrollments/` | Enrollments for specific course |
| GET | `/api/instructor/courses/{course_id}/enrollment-stats/` | Course enrollment stats |

**Stats response (no financial data):**
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

---

## Payments

### Admin Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/payments/` | List all payments |
| POST | `/api/admin/payments/` | Create payment record |
| GET | `/api/admin/payments/{id}/` | Payment details |
| PATCH | `/api/admin/payments/{id}/` | Update notes/reference |
| POST | `/api/admin/payments/{id}/mark-paid/` | Mark as paid |
| POST | `/api/admin/payments/{id}/void/` | Void payment |
| POST | `/api/admin/payments/{id}/refund/` | Mark as refunded |

### User Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/my-payments/` | My payment history |
| GET | `/api/enrollments/{id}/payments/` | Payments for an enrollment |

---

## Refund Requests

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/refund-requests/` | Create refund request |
| GET | `/api/refund-requests/my-requests/` | My refund requests |
| GET | `/api/refund-requests/{id}/` | Request details |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/refund-requests/` | List all |
| GET | `/api/admin/refund-requests/pending/` | Pending requests |
| POST | `/api/admin/refund-requests/{id}/approve-and-process/` | Approve & process |
| POST | `/api/admin/refund-requests/{id}/reject/` | Reject |

---

## Status Workflows

### Enrollment Request Flow
```
PENDING → PROCESSING → ACCEPTED (creates Enrollment + Payment)
   ↓          ↓
CANCELLED   REJECTED
```

### Enrollment Flow
```
ACTIVE → SUSPENDED → ACTIVE (can toggle)
  ↓
COMPLETED or DROPPED
```

### Payment Statuses
`pending` → `paid` | `refunded` | `void`

---

## Dashboard Endpoints

### Admin Dashboard Summary

| | |
|--|--|
| **URL** | `GET /api/admin/enrollment-dashboard/` |
| **Auth** | ✅ Admin or Supervisor |

```json
{
  "pending_requests_count": 15,
  "expiring_soon_count": 5,
  "pending_refunds_count": 2,
  "today_enrollments": 8,
  "active_enrollments_total": 450,
  "revenue_today": "5000.00",
  "revenue_month": "150000.00"
}
```

### Course Enrollment Stats (Admin)

| | |
|--|--|
| **URL** | `GET /api/admin/courses/{id}/enrollment-stats/` |
| **Auth** | ✅ Admin or Supervisor |

```json
{
  "course_id": 1,
  "capacity": 30,
  "enrolled_count": 25,
  "available_spots": 5,
  "pending_requests": 3,
  "total_revenue": "12500.00",
  "collected_revenue": "10000.00",
  "pending_revenue": "2500.00",
  "status_breakdown": {
    "active": 20, "suspended": 2, "completed": 3, "dropped": 0, "refunded": 0
  }
}
```

---

## Important Notes

1. **UUID vs Integer IDs:** User-related models use UUID; Course-related use integer
2. **Participant types:** Enrollments are for either `child` (parent's) or `student` (adult)
3. **Financial privacy:** Instructors never see payment data
4. **Bulk limits:** Max 50 per bulk operation, Admin only
5. **Request expiration:** Requests have `expires_at` (typically 7 days)
