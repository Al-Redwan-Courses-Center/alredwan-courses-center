# Enrollment Management API Endpoints Documentation

## Overview

This document outlines the recommended API endpoints for a complete enrollment management system. The endpoints are organized by resource and role-based access levels.

---

## Role Definitions

| Role | Description |
|------|-------------|
| **Admin** | Full access to all operations |
| **Supervisor** | Can manage enrollments, view reports, limited financial access |
| **Instructor** | Can view their course enrollments, mark attendance |
| **Parent** | Can create enrollment requests for their children |
| **Student** | Can create enrollment requests for themselves |

---

## 1. Enrollment Requests

### 1.1 Public / Authenticated User Endpoints

#### `POST /api/enrollment-requests/`
**Create a new enrollment request**

- **Roles**: Parent, Student
- **Description**: Creates a pending enrollment request
- **Request Body**:
  ```json
  {
    "course_id": "uuid",
    "child_id": "uuid (optional, for parents)",
    "payment_method": "cash|card|bank_transfer|instapay|vodafone_cash|other",
    "notes": "optional notes"
  }
  ```
- **Business Logic**:
  - If requester is a parent, `child_id` is required
  - If requester is a student, `child_id` should be null
  - Auto-validates course capacity and eligibility (age restrictions)
  - Sets `expires_at` to 7 days from creation
  - Auto-sets `price` from course price (can be overridden by admin later)

#### `GET /api/enrollment-requests/my-requests/`
**List user's own enrollment requests**

- **Roles**: Parent, Student
- **Query Params**: `?status=pending|processing|accepted|rejected|expired`
- **Response**: Paginated list of user's requests with course details

#### `GET /api/enrollment-requests/{id}/`
**View single enrollment request details**

- **Roles**: Owner (Parent/Student), Admin, Supervisor
- **Response**: Full request details including course, status, payment info

#### `DELETE /api/enrollment-requests/{id}/`
**Cancel/withdraw an enrollment request**

- **Roles**: Owner (only if status is `pending`)
- **Business Logic**: Only pending requests can be cancelled by the requester

---

### 1.2 Admin / Supervisor Endpoints

#### `GET /api/admin/enrollment-requests/`
**List all enrollment requests**

- **Roles**: Admin, Supervisor
- **Query Params**:
  - `?status=pending|processing|accepted|rejected|expired`
  - `?course_id=uuid`
  - `?season_id=uuid`
  - `?parent_id=uuid`
  - `?student_id=uuid`
  - `?date_from=YYYY-MM-DD`
  - `?date_to=YYYY-MM-DD`
  - `?ordering=-created_at|created_at|expires_at`
- **Response**: Paginated list with filtering and sorting

#### `GET /api/admin/enrollment-requests/pending/`
**List pending requests requiring action**

- **Roles**: Admin, Supervisor
- **Description**: Quick access to requests needing attention
- **Response**: Pending requests sorted by `expires_at` (urgency)

#### `GET /api/admin/enrollment-requests/expiring-soon/`
**List requests expiring within 48 hours**

- **Roles**: Admin, Supervisor
- **Description**: Helps admins prioritize processing

#### `PATCH /api/admin/enrollment-requests/{id}/`
**Update enrollment request**

- **Roles**: Admin, Supervisor
- **Allowed Updates**:
  - `status` → `processing` (mark as being worked on)
  - `price` (for partial payment arrangements)
  - `payment_method`
  - `notes`
  - `expires_at` (extend deadline)

#### `POST /api/admin/enrollment-requests/{id}/approve/`
**Approve enrollment request**

- **Roles**: Admin, Supervisor
- **Request Body**:
  ```json
  {
    "paid_amount": "decimal (optional, defaults to request price or course price)",
    "payment_method": "cash|card|... (optional)",
    "payment_notes": "optional notes for payment record"
  }
  ```
- **Business Logic**:
  - Creates `Enrollment` record with status `ACTIVE`
  - Creates `Payment` record with status `PAID`
  - Increments `course.enrolled_count`
  - Updates request status to `ACCEPTED`
  - Supports partial payments (remaining can be collected later)

#### `POST /api/admin/enrollment-requests/{id}/reject/`
**Reject enrollment request**

- **Roles**: Admin, Supervisor
- **Request Body**:
  ```json
  {
    "reason": "Rejection reason (required)"
  }
  ```

#### `POST /api/admin/enrollment-requests/bulk-approve/`
**Bulk approve multiple requests**

- **Roles**: Admin
- **Request Body**:
  ```json
  {
    "request_ids": ["uuid1", "uuid2", ...],
    "payment_method": "cash (default for all)"
  }
  ```

#### `POST /api/admin/enrollment-requests/bulk-reject/`
**Bulk reject multiple requests**

- **Roles**: Admin
- **Request Body**:
  ```json
  {
    "request_ids": ["uuid1", "uuid2", ...],
    "reason": "Common rejection reason"
  }
  ```

---

## 2. Enrollments

### 2.1 Public / Authenticated User Endpoints

#### `GET /api/enrollments/my-enrollments/`
**List user's active enrollments**

- **Roles**: Parent, Student
- **Query Params**: `?status=active|suspended|completed|dropped|refunded`
- **Response**: Enrollments with course details, payment summary, progress

#### `GET /api/enrollments/{id}/`
**View enrollment details**

- **Roles**: Owner, Admin, Supervisor, Course Instructor
- **Response**: Full details including:
  - Course info
  - Payment history
  - Completion progress
  - Attendance records (if applicable)

#### `GET /api/enrollments/{id}/progress/`
**Get enrollment completion progress**

- **Roles**: Owner, Admin, Supervisor, Course Instructor
- **Response**:
  ```json
  {
    "total_lectures": 10,
    "expected_lectures": 10,
    "completed_lectures": 7,
    "percentage": 70.0,
    "end_date_passed": false,
    "course_end_date": "2026-03-15",
    "is_completable": false
  }
  ```

---

### 2.2 Admin / Supervisor Endpoints

#### `GET /api/admin/enrollments/`
**List all enrollments**

- **Roles**: Admin, Supervisor
- **Query Params**:
  - `?status=active|suspended|completed|dropped|refunded`
  - `?course_id=uuid`
  - `?season_id=uuid`
  - `?instructor_id=uuid`
  - `?student_id=uuid`
  - `?child_id=uuid`
  - `?has_remaining_payment=true|false`
  - `?enrolled_after=YYYY-MM-DD`
  - `?enrolled_before=YYYY-MM-DD`

#### `POST /api/admin/enrollments/`
**Create enrollment directly (bypass request flow)**

- **Roles**: Admin
- **Request Body**:
  ```json
  {
    "course_id": "uuid",
    "student_id": "uuid (mutually exclusive with child_id)",
    "child_id": "uuid (mutually exclusive with student_id)",
    "create_payment": true,
    "payment_amount": "decimal",
    "payment_method": "cash|...",
    "payment_notes": "optional"
  }
  ```
- **Use Case**: Walk-in enrollments, admin override scenarios

#### `PATCH /api/admin/enrollments/{id}/`
**Update enrollment**

- **Roles**: Admin, Supervisor
- **Allowed Updates**:
  - `status` (with valid transitions)
  - Notes/metadata

#### `POST /api/admin/enrollments/{id}/suspend/`
**Suspend an enrollment**

- **Roles**: Admin, Supervisor
- **Request Body**:
  ```json
  {
    "reason": "Suspension reason"
  }
  ```
- **Business Logic**: Only `ACTIVE` enrollments can be suspended

#### `POST /api/admin/enrollments/{id}/reactivate/`
**Reactivate a suspended enrollment**

- **Roles**: Admin, Supervisor
- **Business Logic**: Only `SUSPENDED` enrollments can be reactivated

#### `POST /api/admin/enrollments/{id}/drop/`
**Drop/cancel an enrollment**

- **Roles**: Admin
- **Request Body**:
  ```json
  {
    "reason": "Drop reason"
  }
  ```
- **Business Logic**:
  - Sets status to `DROPPED`
  - Decrements `course.enrolled_count`
  - Does NOT automatically refund (separate process)

#### `POST /api/admin/enrollments/{id}/complete/`
**Manually mark enrollment as completed**

- **Roles**: Admin, Supervisor
- **Business Logic**: For cases where auto-completion criteria aren't met

#### `GET /api/admin/enrollments/completable/`
**List enrollments ready for auto-completion**

- **Roles**: Admin, Supervisor
- **Description**: Enrollments where course has ended or all lectures completed

#### `POST /api/admin/enrollments/mark-completed/`
**Bulk mark completable enrollments as completed**

- **Roles**: Admin
- **Description**: Batch operation for end-of-season processing

---

### 2.3 Instructor Endpoints

#### `GET /api/instructor/courses/{course_id}/enrollments/`
**List enrollments in instructor's course**

- **Roles**: Instructor (own courses only)
- **Response**: Active enrollments with participant info
- **Note**: Limited view (no financial details)

#### `GET /api/instructor/enrollments/`
**List all enrollments across instructor's courses**

- **Roles**: Instructor
- **Query Params**: `?course_id=uuid&status=active`

---

## 3. Payments

### 3.1 Admin / Supervisor Endpoints

#### `GET /api/admin/payments/`
**List all payments**

- **Roles**: Admin, Supervisor (limited)
- **Query Params**:
  - `?status=pending|paid|refunded|void`
  - `?enrollment_id=uuid`
  - `?payer_parent_id=uuid`
  - `?payer_student_id=uuid`
  - `?method=cash|card|bank_transfer|instapay|vodafone_cash|other`
  - `?date_from=YYYY-MM-DD`
  - `?date_to=YYYY-MM-DD`
  - `?min_amount=decimal`
  - `?max_amount=decimal`

#### `POST /api/admin/payments/`
**Create a new payment (e.g., additional payment for enrollment)**

- **Roles**: Admin
- **Request Body**:
  ```json
  {
    "enrollment_id": "uuid",
    "amount": "decimal",
    "method": "cash|...",
    "status": "pending|paid",
    "reference_number": "for bank transfers",
    "notes": "optional"
  }
  ```
- **Use Case**: Recording additional/remaining payments

#### `GET /api/admin/payments/{id}/`
**View payment details**

- **Roles**: Admin, Supervisor

#### `PATCH /api/admin/payments/{id}/`
**Update payment**

- **Roles**: Admin
- **Allowed Updates**: `notes`, `reference_number`

#### `POST /api/admin/payments/{id}/mark-paid/`
**Mark pending payment as paid**

- **Roles**: Admin
- **Business Logic**: Sets status to `PAID`, records `processed_at` and `processed_by`

#### `POST /api/admin/payments/{id}/void/`
**Void a pending payment**

- **Roles**: Admin
- **Use Case**: Cancel an erroneous payment entry

#### `POST /api/admin/payments/{id}/refund/`
**Mark payment as refunded**

- **Roles**: Admin
- **Note**: This is for individual payment refunds; for full enrollment refunds, use Refund Requests

---

### 3.2 User Endpoints

#### `GET /api/payments/my-payments/`
**List user's payment history**

- **Roles**: Parent, Student
- **Response**: All payments made by the user

#### `GET /api/enrollments/{id}/payments/`
**List payments for a specific enrollment**

- **Roles**: Owner, Admin, Supervisor
- **Response**: All payments linked to the enrollment with summary

---

## 4. Refund Requests

### 4.1 User Endpoints

#### `POST /api/refund-requests/`
**Create a refund request**

- **Roles**: Parent, Student
- **Request Body**:
  ```json
  {
    "enrollment_id": "uuid",
    "reason": "Reason for refund request"
  }
  ```
- **Business Logic**: Only active enrollments can have refund requests

#### `GET /api/refund-requests/my-requests/`
**List user's refund requests**

- **Roles**: Parent, Student

#### `GET /api/refund-requests/{id}/`
**View refund request details**

- **Roles**: Owner, Admin, Supervisor

---

### 4.2 Admin Endpoints

#### `GET /api/admin/refund-requests/`
**List all refund requests**

- **Roles**: Admin
- **Query Params**:
  - `?status=requested|approved|rejected|processed`
  - `?enrollment_id=uuid`
  - `?date_from=YYYY-MM-DD`
  - `?date_to=YYYY-MM-DD`

#### `GET /api/admin/refund-requests/pending/`
**List pending refund requests**

- **Roles**: Admin
- **Description**: Quick access to requests needing action

#### `POST /api/admin/refund-requests/{id}/approve-and-process/`
**Approve and process refund**

- **Roles**: Admin
- **Business Logic**:
  - Marks all related `PAID` payments as `REFUNDED`
  - Marks enrollment as `REFUNDED`
  - Decrements `course.enrolled_count`
  - Sets refund request to `PROCESSED`

#### `POST /api/admin/refund-requests/{id}/reject/`
**Reject refund request**

- **Roles**: Admin
- **Request Body**:
  ```json
  {
    "note": "Reason for rejection"
  }
  ```

---

## 5. Course Enrollment Stats (For Dashboards)

### 5.1 Admin / Supervisor Endpoints

#### `GET /api/admin/courses/{id}/enrollment-stats/`
**Get enrollment statistics for a course**

- **Roles**: Admin, Supervisor
- **Response**:
  ```json
  {
    "course_id": "uuid",
    "capacity": 30,
    "enrolled_count": 25,
    "available_spots": 5,
    "pending_requests": 3,
    "total_revenue": "12500.00",
    "collected_revenue": "10000.00",
    "pending_revenue": "2500.00",
    "status_breakdown": {
      "active": 20,
      "suspended": 2,
      "completed": 3,
      "dropped": 0,
      "refunded": 0
    }
  }
  ```

#### `GET /api/admin/seasons/{id}/enrollment-summary/`
**Get enrollment summary for a season**

- **Roles**: Admin, Supervisor
- **Response**: Aggregated stats across all courses in the season

#### `GET /api/admin/enrollment-dashboard/`
**Dashboard summary**

- **Roles**: Admin, Supervisor
- **Response**:
  ```json
  {
    "pending_requests_count": 15,
    "expiring_soon_count": 5,
    "pending_refunds_count": 2,
    "today_enrollments": 8,
    "week_enrollments": 45,
    "month_enrollments": 180,
    "active_enrollments_total": 450,
    "revenue_today": "5000.00",
    "revenue_week": "35000.00",
    "revenue_month": "150000.00"
  }
  ```

---

### 5.2 Instructor Endpoints

#### `GET /api/instructor/courses/{id}/enrollment-stats/`
**Get enrollment stats for instructor's course**

- **Roles**: Instructor (own courses only)
- **Response**: Limited view (no financial data):
  ```json
  {
    "course_id": "uuid",
    "capacity": 30,
    "enrolled_count": 25,
    "available_spots": 5,
    "active_students": 20,
    "suspended_students": 2,
    "completed_students": 3
  }
  ```

---

## 6. Utility Endpoints

#### `GET /api/courses/{id}/enrollment-eligibility/`
**Check if current user can enroll in a course**

- **Roles**: Authenticated
- **Response**:
  ```json
  {
    "eligible": true,
    "reasons": [],
    "available_spots": 5,
    "already_enrolled": false,
    "has_pending_request": false
  }
  ```
  or
  ```json
  {
    "eligible": false,
    "reasons": [
      "Age requirement not met (min: 10, max: 15)",
      "Course is full",
      "Already enrolled in this course"
    ]
  }
  ```

#### `GET /api/courses/{id}/available-children/`
**Get parent's children eligible for a course**

- **Roles**: Parent
- **Response**: List of children with eligibility status for the course

---

## 7. Webhook / Automation Endpoints (Internal)

#### `POST /api/internal/enrollments/process-expirations/`
**Mark expired enrollment requests**

- **Auth**: Internal/Cron only
- **Description**: Scheduled task to update expired requests

#### `POST /api/internal/enrollments/auto-complete/`
**Auto-complete eligible enrollments**

- **Auth**: Internal/Cron only
- **Description**: Scheduled task to mark completable enrollments

---

## Implementation Notes

### Authentication
- Use JWT or session-based authentication
- Role-based permissions should be enforced at the view level
- Consider using Django REST Framework's permission classes

### Pagination
- Default page size: 20
- Max page size: 100
- Use cursor pagination for large datasets

### Rate Limiting
- Public endpoints: 100 requests/minute
- Admin endpoints: 500 requests/minute

### Filtering Best Practices
- Use django-filter for complex filtering
- Index frequently filtered fields (already done in models)

### Serializers
- Create separate serializers for list/detail/create/update operations
- Use nested serializers for related data (course, participant info)
- Implement minimal serializers for list views (performance)

### Notifications (Future)
- Send SMS/email on enrollment approval/rejection
- Notify parents on payment reminders
- Alert admins on expiring requests

---

## Suggested URL Structure

```
/api/v1/
├── enrollment-requests/
│   ├── (POST) - Create request
│   ├── my-requests/ (GET) - User's requests
│   └── {id}/ (GET, DELETE)
│
├── enrollments/
│   ├── my-enrollments/ (GET)
│   ├── {id}/ (GET)
│   └── {id}/progress/ (GET)
│
├── payments/
│   └── my-payments/ (GET)
│
├── refund-requests/
│   ├── (POST) - Create request
│   ├── my-requests/ (GET)
│   └── {id}/ (GET)
│
├── courses/
│   ├── {id}/enrollment-eligibility/ (GET)
│   └── {id}/available-children/ (GET)
│
├── admin/
│   ├── enrollment-requests/
│   │   ├── (GET) - List all
│   │   ├── pending/ (GET)
│   │   ├── expiring-soon/ (GET)
│   │   ├── {id}/ (GET, PATCH)
│   │   ├── {id}/approve/ (POST)
│   │   ├── {id}/reject/ (POST)
│   │   ├── bulk-approve/ (POST)
│   │   └── bulk-reject/ (POST)
│   │
│   ├── enrollments/
│   │   ├── (GET, POST)
│   │   ├── completable/ (GET)
│   │   ├── mark-completed/ (POST)
│   │   ├── {id}/ (GET, PATCH)
│   │   ├── {id}/suspend/ (POST)
│   │   ├── {id}/reactivate/ (POST)
│   │   ├── {id}/drop/ (POST)
│   │   └── {id}/complete/ (POST)
│   │
│   ├── payments/
│   │   ├── (GET, POST)
│   │   ├── {id}/ (GET, PATCH)
│   │   ├── {id}/mark-paid/ (POST)
│   │   ├── {id}/void/ (POST)
│   │   └── {id}/refund/ (POST)
│   │
│   ├── refund-requests/
│   │   ├── (GET)
│   │   ├── pending/ (GET)
│   │   ├── {id}/ (GET)
│   │   ├── {id}/approve-and-process/ (POST)
│   │   └── {id}/reject/ (POST)
│   │
│   ├── courses/{id}/enrollment-stats/ (GET)
│   ├── seasons/{id}/enrollment-summary/ (GET)
│   └── enrollment-dashboard/ (GET)
│
└── instructor/
    ├── courses/{id}/enrollments/ (GET)
    ├── courses/{id}/enrollment-stats/ (GET)
    └── enrollments/ (GET)
```
