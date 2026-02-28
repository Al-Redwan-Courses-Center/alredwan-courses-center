# 📋 Attendance API

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

> These don't require JWT — they authenticate via `device_id`.

### Check-in

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

### Check-out

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

---

### Instructor History

| | |
|--|--|
| **URL** | `GET /api/attendance/instructor/{instructor_id}/` |
| **Auth** | ✅ Admin |

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

### Mark Lecture Attendance

| | |
|--|--|
| **URL** | `POST /api/attendance/lecture/{lecture_id}/mark/` |
| **Auth** | ✅ Required (Admin or Course Instructor) |

Marks attendance for a single student/child in a lecture.

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
| `notes` | string | No | Optional notes about attendance |

---

### Bulk Mark Attendance

| | |
|--|--|
| **URL** | `POST /api/attendance/lecture/{lecture_id}/mark-bulk/` |
| **Auth** | ✅ Required (Admin or Course Instructor) |

Marks attendance for multiple students/children at once.

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

Returns detailed attendance for all enrolled students/children in a lecture, including their personal information.

**Response (200):**
```json
{
  "lecture_id": 123,
  "lecture_title": "Lecture 1 - Introduction",
  "course_name": "Quran Memorization",
  "total_enrolled": 15,
  "present_count": 12,
  "absent_count": 3,
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

| Field | Type | Description |
|-------|------|-------------|
| `lecture_id` | integer | ID of the lecture |
| `lecture_title` | string | Title of the lecture |
| `course_name` | string | Name of the course |
| `total_enrolled` | integer | Total number of students/children enrolled |
| `present_count` | integer | Number of participants marked present |
| `absent_count` | integer | Number of participants not present |
| `attendance_rate` | float | Percentage of attendance (0-100) |
| `attendances` | array | List of attendance records |

**Attendance Record Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `participant_name` | string | First name of the participant |
| `participant_full_name` | string | Full name of the participant |
| `participant_type` | string | `child` or `student` |
| `participant_code` | string | Unique code (e.g., M12345) |
| `participant_image` | string/null | URL to participant's profile image |
| `participant_age` | integer/null | Current age in years |
| `participant_gender` | string | `boy`/`girl` for children, gender for students |
| `present` | boolean | Whether participant was present |
| `rating` | integer/null | Rating from 1-10 (if marked) |
| `notes` | string | Optional notes about attendance |
| `marked_via` | string | Method used: `manual`, `qr_scan` |
| `marked_at` | datetime/null | When attendance was marked |

**Errors:**

| Code | Description |
|------|-------------|
| 404 | Lecture not found |
| 403 | User is not admin or course instructor |

---

## Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/attendance/check-in/` | Fingerprint check-in | Device ID |
| POST | `/api/attendance/check-out/` | Fingerprint check-out | Device ID |
| GET | `/api/attendance/today/` | Today's attendance | Admin |
| GET | `/api/attendance/today/summary/` | Today's summary | Admin |
| GET | `/api/attendance/{id}/` | Attendance detail | Admin |
| POST | `/api/attendance/{id}/rate/` | Rate attendance | Admin |
| POST | `/api/attendance/{id}/manual-check-in/` | Manual check-in | Admin |
| POST | `/api/attendance/{id}/manual-check-out/` | Manual check-out | Admin |
| POST | `/api/attendance/{id}/mark-absent/` | Mark absent | Admin |
| GET | `/api/attendance/date/{YYYY-MM-DD}/` | By date | Admin |
| GET | `/api/attendance/instructor/{id}/` | Instructor history | Admin |
| GET/POST | `/api/attendance/devices/` | Device management | Admin |
| GET/POST | `/api/attendance/schedules/` | Schedule management | Admin |
| POST | `/api/attendance/lecture/{id}/mark/` | Mark lecture attendance | Admin/Instructor |
| POST | `/api/attendance/lecture/{id}/mark-bulk/` | Bulk mark attendance | Admin/Instructor |
| GET | `/api/attendance/lecture/{id}/details/` | Lecture attendance details | Admin/Instructor |
