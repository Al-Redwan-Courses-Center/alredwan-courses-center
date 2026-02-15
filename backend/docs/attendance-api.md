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
| **Auth** | ✅ Required |

Marks attendance for students/children in a lecture.

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
| POST | `/api/attendance/lecture/{id}/mark/` | Mark lecture attendance | Required |
