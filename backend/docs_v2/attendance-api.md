# 📋 Attendance API Documentation

Instructor attendance tracking (fingerprint devices, manual entry, ratings) and student lecture attendance.

---

## Table of Contents

1. [Instructor Attendance Overview](#instructor-attendance-overview)
2. [Fingerprint Device Endpoints](#fingerprint-device-endpoints)
3. [Admin Dashboard Endpoints](#admin-dashboard-endpoints)
4. [Rating System](#rating-system)
5. [Device Management](#device-management)
6. [Schedule Management](#schedule-management)
7. [Student Lecture Attendance](#student-lecture-attendance)
8. [Time Restrictions](#time-restrictions)
9. [Quick Reference](#quick-reference)

---

## Instructor Attendance Overview

### Attendance Types

| Type | Description | Created By |
|------|-------------|------------|
| `lecture` | Teaching a specific lecture | Cron job (from course schedule) |
| `supervision` | Supervisor shift | Cron job (from SupervisorSchedule) |

An instructor can have **both** types on the same day.

### Status Flow

```
NOT_STARTED → PENDING → PRESENT (on time) or LATE (after grace period) or ABSENT (no check-in)
```

| Status | Description | Can be rated? |
|--------|-------------|---------------|
| `not_started` | Day hasn't started | No |
| `pending` | Awaiting check-in | No |
| `present` | Checked in on time | ✅ Yes |
| `late` | Checked in after grace period | ✅ Yes |
| `absent` | Did not check in | No |

---

## Fingerprint Device Endpoints

> These endpoints don't require JWT — they authenticate via `device_id`.

### Unified Scan (Recommended)

The **recommended** endpoint for fingerprint devices that don't distinguish between check-in and check-out.

| | |
|--|--|
| **URL** | `POST /api/attendance/scan/` |
| **Auth** | No (uses device_id) |

```json
{
  "fingerprint_id": "FP123456",
  "device_id": "DEVICE001",
  "timestamp": "2026-02-14T08:30:00+02:00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fingerprint_id` | string | Yes | Unique fingerprint ID from device |
| `device_id` | string | Yes | Hardware device ID |
| `timestamp` | datetime | No | For offline sync (defaults to current time) |

**Logic:**

| Scenario | Action | Code |
|----------|--------|------|
| No attendance record for today | Auto-create from schedule + check-in | 201 |
| Has record, not checked in | Check-in | 200 |
| Checked in, not checked out | Check-out | 200 |
| Already checked out | Re-entry (clears check-out) | 200 |
| Rapid scan (< 2 min since last) | Ignored as duplicate | 200 |

All scans are logged to `FingerprintScanLog` for audit trail.

---

### Check-in (Legacy)

| | |
|--|--|
| **URL** | `POST /api/attendance/check-in/` |
| **Auth** | No (uses device_id) |

```json
{
  "fingerprint_id": "FP123456",
  "device_id": "DEVICE001",
  "method": "fingerprint"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fingerprint_id` | string | Yes | Unique fingerprint ID from device |
| `device_id` | string | Yes | Hardware device ID |
| `method` | string | No | `fingerprint`, `rfid`, `qr_code`, `manual` |

**Success (200):**

```json
{
  "message": "Check-in successful",
  "instructor": "محمد أحمد",
  "check_in_time": "2026-02-05T08:30:00+02:00",
  "records": [
    { "id": 123, "type": "lecture", "status": "present" },
    { "id": 124, "type": "supervision", "status": "late" }
  ]
}
```

**Already checked in:** Returns `{"message": "Already checked in", ...}`

**Errors:**

| Code | Cause |
|------|-------|
| 400 | Invalid fingerprint or inactive device |
| 404 | No attendance records for today |

---

### Check-out (Legacy)

| | |
|--|--|
| **URL** | `POST /api/attendance/check-out/` |
| **Auth** | No (uses device_id) |

Same request body as check-in.

**Success (200):**

```json
{
  "message": "Check-out successful",
  "instructor": "محمد أحمد",
  "check_out_time": "2026-02-05T14:30:00+02:00",
  "records": [{ "id": 123, "type": "lecture", "check_out_time": "..." }]
}
```

---

## Admin Dashboard Endpoints

> All require **Admin JWT** authentication.

### Today's Attendance

| | |
|--|--|
| **URL** | `GET /api/attendance/today/` |
| **Auth** | ✅ Admin |

**Response (200):**

```json
[
  {
    "id": 123,
    "instructor": 1,
    "instructor_name": "محمد أحمد",
    "date": "2026-02-05",
    "check_in_time": "2026-02-05T08:30:00+02:00",
    "check_out_time": null,
    "status": "present",
    "status_display": "حاضر",
    "attendance_type": "lecture",
    "attendance_type_display": "محاضرة",
    "rating": "0.00"
  }
]
```

---

### Today's Summary

| | |
|--|--|
| **URL** | `GET /api/attendance/today/summary/` |
| **Auth** | ✅ Admin |

**Response (200):**

```json
{
  "date": "2026-02-05",
  "total_expected": 15,
  "checked_in": 10,
  "checked_out": 3,
  "present": 8,
  "late": 2,
  "absent": 1,
  "pending": 0,
  "not_started": 4,
  "lecture_attendance_count": 10,
  "supervision_attendance_count": 5
}
```

---

### Attendance by Date

| | |
|--|--|
| **URL** | `GET /api/attendance/date/{YYYY-MM-DD}/` |
| **Auth** | ✅ Admin |

Returns same format as Today's Attendance for the specified date.

---

### Attendance Detail

| | |
|--|--|
| **URL** | `GET/PUT/PATCH /api/attendance/{id}/` |
| **Auth** | ✅ Admin |

---

### Instructor History

| | |
|--|--|
| **URL** | `GET /api/attendance/instructor/{instructor_id}/` |
| **Auth** | ✅ Admin |

---

### All Attendance Records (Admin)

Full access to ALL attendance records (past and future) with comprehensive filtering.

| | |
|--|--|
| **URL** | `GET /api/attendance/all/` |
| **Auth** | ✅ Admin / Supervisor (`role == 'admin'` or `role == 'supervisor'`) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | date | Filter records from this date (inclusive). Format: `YYYY-MM-DD` |
| `date_to` | date | Filter records up to this date (inclusive). Format: `YYYY-MM-DD` |
| `instructor` | UUID | Filter by instructor user ID |
| `status` | string | Filter by status: `present`, `absent`, `late`, `pending`, `not_started` |
| `attendance_type` | string | Filter by type: `lecture`, `supervision` |
| `rated_by` | UUID | Filter by the admin user ID who rated |
| `has_rating` | boolean | Filter by whether attendance has been rated (`true`/`false`) |
| `season` | integer | Filter by season ID |
| `checked_in` | boolean | Filter by check-in status (`true`/`false`) |
| `checked_out` | boolean | Filter by check-out status (`true`/`false`) |

**Examples:**

```http
GET /api/attendance/all/?date_from=2025-01-01&date_to=2025-01-31
GET /api/attendance/all/?instructor=<uuid>&status=present
GET /api/attendance/all/?attendance_type=supervision&has_rating=false
GET /api/attendance/all/?checked_in=true&status=late
```

**Response (200):**

```json
[
  {
    "id": 123,
    "instructor": 1,
    "instructor_name": "محمد أحمد",
    "instructor_type": "معلم",
    "date": "2026-02-05",
    "check_in_time": "2026-02-05T08:30:00+02:00",
    "check_out_time": "2026-02-05T14:00:00+02:00",
    "check_in_method": "fingerprint",
    "check_out_method": "fingerprint",
    "status": "present",
    "status_display": "حاضر",
    "attendance_type": "lecture",
    "attendance_type_display": "محاضرة",
    "schedule": null,
    "schedule_info": null,
    "lecture": 45,
    "lecture_title": "القرآن الكريم - المستوى 2",
    "season": 1,
    "rating": "8.50",
    "rated_by": 1,
    "rated_by_name": "Admin User",
    "rated_at": "2026-02-05T15:30:00+02:00",
    "notes": "أداء ممتاز في الشرح"
  }
]
```

**Response includes `rated_by` information:** When an attendance record has been rated, the response shows who rated it (`rated_by_name`), when (`rated_at`), and any notes.

---

### Edit Any Attendance Record (Admin Only)

Edit ANY attendance record including past records. Admin-only endpoint for correcting historical data.

| | |
|--|--|
| **URL** | `GET/PUT/PATCH /api/attendance/all/{id}/` |
| **Auth** | ✅ Admin only (`role == 'admin'` or `is_superuser`) |

**Editable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Change status: `present`, `absent`, `late`, `pending`, `not_started` |
| `check_in_time` | datetime | Manually set check-in time |
| `check_out_time` | datetime | Manually set check-out time |
| `check_in_method` | string | Set method: `fingerprint`, `rfid`, `qr_code`, `manual` |
| `check_out_method` | string | Set method |
| `rating` | decimal | Set rating (1.00 - 10.00), requires present/late status |
| `notes` | string | Add/update notes |
| `attendance_type` | string | Change type: `lecture`, `supervision` |

**Example Request:**

```json
{
  "status": "present",
  "check_in_time": "2026-02-05T08:30:00+02:00",
  "rating": 9.0,
  "notes": "تم تصحيح الحضور يدوياً"
}
```

**Validation Rules:**
- Setting `status` to `absent` will clear the rating
- Setting `rating > 0` requires `status` to be `present` or `late`
- `check_out_time` must be after `check_in_time`

**Response (200):** Returns the updated attendance record.

---

### Manual Check-in

| | |
|--|--|
| **URL** | `POST /api/attendance/{id}/manual-check-in/` |
| **Auth** | ✅ Admin |

---

### Manual Check-out

| | |
|--|--|
| **URL** | `POST /api/attendance/{id}/manual-check-out/` |
| **Auth** | ✅ Admin |

---

### Mark Absent

| | |
|--|--|
| **URL** | `POST /api/attendance/{id}/mark-absent/` |
| **Auth** | ✅ Admin |

---

### Generate Attendance Records

Manually generate attendance records for a date range. This allows admins to pre-create attendance records for upcoming days or backfill missed records.

| | |
|--|--|
| **URL** | `POST /api/attendance/generate/` |
| **Auth** | ✅ Admin |

**Request Body:**

```json
{
  "start_date": "2026-03-01",
  "end_date": "2026-03-07",
  "season_id": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start_date` | date | Yes | Start date for generation (YYYY-MM-DD) |
| `end_date` | date | Yes | End date for generation (YYYY-MM-DD) |
| `season_id` | integer | No | Season ID. If not provided, uses active season |

**Validation:**
- `end_date` must be on or after `start_date`
- Maximum date range is 60 days
- Invalid `season_id` returns 404

**Response (201):**

```json
{
  "message": "Attendance records generated successfully",
  "created_count": 14,
  "start_date": "2026-03-01",
  "end_date": "2026-03-07",
  "season": "الموسم الدراسي 2026"
}
```

**Notes:**
- Uses `get_or_create` internally, so duplicate records are NOT created
- Safe to run multiple times for the same date range
- Generates records based on:
  - **SupervisorSchedule** entries (supervision attendance)
  - **Scheduled lectures** (lecture attendance)
- All generations are logged in `AttendanceCronLog` for audit trail
- Compatible with the weekly cron job (no conflicts)

---

## Rating System

| Rating Value | Meaning |
|--------------|---------|
| `null` | Cannot be rated (absent/not started) |
| `0.00` | Attended but not yet rated |
| `1.00 - 10.00` | Actual performance rating |

**Rules:**
- Only `present` or `late` attendance can be rated
- Can be updated multiple times (last one wins)
- Tracks `rated_by` and `rated_at`

### Rate Attendance

| | |
|--|--|
| **URL** | `POST /api/attendance/{id}/rate/` |
| **Auth** | ✅ Admin |

```json
{
  "rating": 8.5,
  "notes": "أداء ممتاز في الشرح"
}
```

| Field | Type | Required | Range |
|-------|------|----------|-------|
| `rating` | decimal | Yes | 1.00 – 10.00 |
| `notes` | string | No | Free text |

---

## Device Management

| | |
|--|--|
| **URL** | `GET/POST /api/attendance/devices/` |
| **Detail** | `GET/PATCH/DELETE /api/attendance/devices/{id}/` |
| **Auth** | ✅ Admin |

**Create:**

```json
{
  "device_id": "DEVICE002",
  "name": "البوابة الخلفية",
  "location": "المدخل الخلفي",
  "is_active": true
}
```

---

## Schedule Management

Manage weekly supervisor schedules.

| | |
|--|--|
| **URL** | `GET/POST /api/attendance/schedules/` |
| **Detail** | `GET/PATCH/DELETE /api/attendance/schedules/{id}/` |
| **Auth** | ✅ Admin |

**Create:**

```json
{
  "instructor": 1,
  "day_of_week": 0,
  "start_time": "08:00:00",
  "end_time": "14:00:00",
  "grace_period_minutes": 15,
  "auto_absent_after_minutes": 60
}
```

**Day of Week:** 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

---

## Student Lecture Attendance

### Time Restrictions Overview

Lecture attendance marking has time-based restrictions to ensure data integrity:

| User Type | Past Lectures | Future Lectures | Window |
|-----------|---------------|-----------------|--------|
| Regular Instructor | ⏱️ 24h window | ❌ Blocked | Lecture start → +24h |
| Admin/Supervisor | ✅ Any time | ❌ Blocked | No restriction |
| Superuser | ✅ Any time | ✅ Allowed | No restriction |

**Admin/Supervisor Detection:**
- `is_superuser = True`
- `is_staff = True`
- `role` field = `admin` or `supervisor`
- `instructor_profile.type` = `supervisor`

### Mark Lecture Attendance

| | |
|--|--|
| **URL** | `POST /api/attendance/lecture/{lecture_id}/mark/` |
| **Auth** | ✅ Required (Admin or Course Instructor) |

Marks attendance for a single student/child in a lecture.

**Time Restrictions Apply:** See [Time Restrictions Overview](#time-restrictions-overview) above.

**Request Body:**

```json
{
  "code": "M64793",
  "participant_type": "student",
  "rating": 8,
  "notes": "Good performance"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Unique code of the student or child |
| `participant_type` | string | Yes | `student` or `child` |
| `rating` | integer | Yes | Rating from 1 to 10 |
| `notes` | string | No | Optional notes |

---

### Bulk Mark Attendance

| | |
|--|--|
| **URL** | `POST /api/attendance/lecture/{lecture_id}/mark-bulk/` |
| **Auth** | ✅ Required (Admin or Course Instructor) |

**Time Restrictions Apply:** See [Time Restrictions Overview](#time-restrictions-overview) above.

**Request Body:**

```json
{
  "marked_via": "manual",
  "attendances": [
    {
      "code": "M64793",
      "participant_type": "student",
      "rating": 8,
      "notes": "Good performance",
      "present": true
    },
    {
      "code": "C12345",
      "participant_type": "child",
      "rating": 9,
      "notes": "Excellent",
      "present": true
    }
  ]
}
```

---

### Get Lecture Attendance Details

| | |
|--|--|
| **URL** | `GET /api/attendance/lecture/{lecture_id}/details/` |
| **Auth** | ✅ Required (Admin or Course Instructor) |

Returns detailed attendance for all enrolled students/children, including personal information.

**Response (200):**

```json
{
  "lecture_id": 123,
  "lecture_title": "Lecture 1 - Introduction",
  "course_name": "Quran Memorization",
  "lecture_date": "2026-02-20",
  "lecture_start_time": "09:00:00",
  "is_future_lecture": false,
  "is_attendance_submittable": true,
  "is_editable": true,
  "submission_deadline": "2026-02-21T09:00:00+02:00",
  "user_can_bypass_deadline": false,
  "user_can_mark_future_lectures": false,
  "total_enrolled": 15,
  "present_count": 12,
  "absent_count": 3,
  "not_marked_count": 0,
  "attendance_rate": 80.0,
  "attendances": [
    {
      "id": 1,
      "lecture": 123,
      "lecture_title": "Lecture 1 - Introduction",
      "participant_name": "أحمد",
      "participant_full_name": "أحمد محمد علي",
      "participant_type": "child",
      "participant_code": "M12345",
      "participant_image": "https://res.cloudinary.com/.../image.jpg",
      "participant_age": 12,
      "participant_gender": "boy",
      "present": true,
      "rating": 8,
      "notes": "ممتاز في الحفظ",
      "marked_by": 5,
      "marked_by_name": "الأستاذ عمر",
      "marked_via": "manual",
      "marked_at": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-10T08:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Summary Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `lecture_id` | integer | ID of the lecture |
| `lecture_title` | string | Title of the lecture |
| `course_name` | string | Name of the course |
| `lecture_date` | string | Date of the lecture |
| `lecture_start_time` | string | Start time of the lecture |
| `is_future_lecture` | boolean | Whether the lecture hasn't started yet |
| `is_attendance_submittable` | boolean | Whether the current user can submit attendance |
| `is_editable` | boolean | Whether the current user can edit attendance |
| `submission_deadline` | datetime/null | Deadline for instructors (null for admins or future lectures) |
| `user_can_bypass_deadline` | boolean | Whether current user bypasses time restrictions |
| `user_can_mark_future_lectures` | boolean | Whether current user can mark future lectures |
| `total_enrolled` | integer | Total enrolled students/children |
| `present_count` | integer | Participants marked present |
| `absent_count` | integer | Participants not present |
| `not_marked_count` | integer | Participants not yet marked |
| `attendance_rate` | float | Attendance percentage (0-100) |

**Attendance Record Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `participant_name` | string | First name |
| `participant_full_name` | string | Full name |
| `participant_type` | string | `child` or `student` |
| `participant_code` | string | Unique code (e.g., M12345) |
| `participant_image` | string/null | Profile image URL |
| `participant_age` | integer/null | Current age in years |
| `participant_gender` | string | `boy`/`girl` for children, gender for students |
| `present` | boolean | Whether participant was present |
| `rating` | integer/null | Rating from 1-10 (if marked) |
| `notes` | string | Optional notes |
| `marked_via` | string | Method used: `manual`, `qr_scan` |
| `marked_at` | datetime/null | When attendance was marked |

**Errors:**

| Code | Description |
|------|-------------|
| 404 | Lecture not found |
| 403 | User is not admin or course instructor |
| 403 | Attendance marking window has expired (for instructors after 24h) |
| 403 | Cannot mark attendance for future lectures (non-superusers) |

---

## Time Restrictions

### Lecture Attendance Time Window

Lecture attendance can only be marked within specific time windows based on user role.

### For Regular Instructors

- **Window Start:** Lecture start time
- **Window End:** 24 hours after lecture start
- **Future Lectures:** ❌ Not allowed

**Error Response (Window Expired):**

```json
{
  "error": "Attendance marking window has expired.",
  "details": "Attendance can only be marked within 24 hours after the lecture.",
  "lecture_start": "2026-02-10T09:00:00+02:00",
  "window_end": "2026-02-11T09:00:00+02:00"
}
```

**Error Response (Future Lecture):**

```json
{
  "error": "Cannot mark attendance for future lectures.",
  "details": "Only super administrators can mark attendance for lectures that have not started yet.",
  "lecture_start": "2026-02-20T09:00:00+02:00",
  "current_time": "2026-02-15T10:30:00+02:00"
}
```

### For Admins/Supervisors

- **Past Lectures:** ✅ No time restriction
- **Future Lectures:** ❌ Not allowed

### For Superusers (`is_superuser=True`)

- **Past Lectures:** ✅ No time restriction
- **Future Lectures:** ✅ Allowed

### User Role Detection

The system checks the following attributes to determine admin/supervisor status:

| Attribute | Value | Effect |
|-----------|-------|--------|
| `is_superuser` | `True` | Full access (past & future lectures) |
| `is_staff` | `True` | Admin access (bypass time window for past) |
| `role` | `admin` or `supervisor` | Admin access |
| `instructor_profile.type` | `supervisor` | Admin access |

---

## Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/attendance/scan/` | Unified fingerprint scan | Device ID |
| POST | `/api/attendance/check-in/` | Fingerprint check-in (legacy) | Device ID |
| POST | `/api/attendance/check-out/` | Fingerprint check-out (legacy) | Device ID |
| GET | `/api/attendance/all/` | **All attendance with filters** | Admin/Supervisor |
| GET/PUT/PATCH | `/api/attendance/all/{id}/` | **Edit any attendance (past)** | Admin only |
| POST | `/api/attendance/generate/` | **Generate attendance records** | Admin |
| GET | `/api/attendance/today/` | Today's attendance | Admin |
| GET | `/api/attendance/today/summary/` | Today's summary | Admin |
| GET/PUT/PATCH | `/api/attendance/{id}/` | Attendance detail / update | Admin |
| POST | `/api/attendance/{id}/rate/` | Rate attendance | Admin |
| POST | `/api/attendance/{id}/manual-check-in/` | Manual check-in | Admin |
| POST | `/api/attendance/{id}/manual-check-out/` | Manual check-out | Admin |
| POST | `/api/attendance/{id}/mark-absent/` | Mark absent | Admin |
| GET | `/api/attendance/date/{YYYY-MM-DD}/` | By date | Admin |
| GET | `/api/attendance/instructor/{id}/` | Instructor history | Admin |
| GET/POST | `/api/attendance/devices/` | Device management | Admin |
| GET/PATCH/DELETE | `/api/attendance/devices/{id}/` | Device detail | Admin |
| GET/POST | `/api/attendance/schedules/` | Schedule management | Admin (create) / All roles (view) |
| GET/PATCH/DELETE | `/api/attendance/schedules/{id}/` | Schedule detail | Admin (edit/delete) / Own (view) |
| GET | `/api/attendance/my-schedule/` | **My weekly schedule** | Instructor |
| POST | `/api/attendance/lecture/{id}/mark/` | Mark lecture attendance | Admin/Instructor |
| POST | `/api/attendance/lecture/{id}/mark-bulk/` | Bulk mark attendance | Admin/Instructor |
| GET | `/api/attendance/lecture/{id}/details/` | Lecture attendance details | Admin/Instructor |
