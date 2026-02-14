# Instructor Attendance API Documentation

This document provides detailed information about the instructor attendance system API endpoints for frontend developers and device integrators.

**Base URL:** `http://localhost:8000`  
**API Prefix:** `/api/attendance/`

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Attendance Types](#attendance-types)
- [Status Flow](#status-flow)
- [Rating System](#rating-system)
- [Endpoints](#endpoints)
  - [Unified Fingerprint Scan (Recommended)](#0-unified-fingerprint-scan-recommended)
  - [Fingerprint Check-in (Legacy)](#1-fingerprint-check-in-legacy)
  - [Fingerprint Check-out (Legacy)](#2-fingerprint-check-out-legacy)
  - [Today's Attendance List](#3-todays-attendance-list)
  - [Today's Summary](#4-todays-summary)
  - [Attendance Detail](#5-attendance-detail)
  - [Rate Attendance](#6-rate-attendance)
  - [Manual Check-in](#7-manual-check-in)
  - [Manual Check-out](#8-manual-check-out)
  - [Mark Absent](#9-mark-absent)
  - [Attendance by Date](#10-attendance-by-date)
  - [Instructor History](#11-instructor-history)
  - [Device Management](#12-device-management)
  - [Schedule Management](#13-schedule-management)
  - [Scan Logs](#14-scan-logs)
- [WebSocket Real-time Updates](#websocket-real-time-updates)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

The instructor attendance system tracks check-in/check-out times for instructors using fingerprint devices. It supports two types of attendance:

1. **Lecture Attendance** — For instructors assigned to teach lectures
2. **Supervision Attendance** — For supervisors with scheduled shifts

**Key Features:**
- Fingerprint device integration for check-in/check-out
- Real-time WebSocket updates for admin dashboard
- Rating system for instructor performance (1-10)
- Manual override by admin
- Automatic absent marking via cron jobs

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Instructor Attendance System                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐         ┌──────────────────┐                      │
│  │ Fingerprint      │ ──────► │ Check-in/out     │                      │
│  │ Device           │         │ API Endpoint     │                      │
│  └──────────────────┘         └────────┬─────────┘                      │
│                                        │                                 │
│                                        ▼                                 │
│                          ┌─────────────────────────┐                    │
│                          │  InstructorAttendance   │                    │
│                          │  Model                  │                    │
│                          └────────────┬────────────┘                    │
│                                       │                                  │
│                    ┌──────────────────┼──────────────────┐              │
│                    │                  │                  │              │
│                    ▼                  ▼                  ▼              │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐    │
│  │ WebSocket        │   │ Admin Dashboard  │   │ Rating System    │    │
│  │ Broadcast        │   │ REST API         │   │ by Admin         │    │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Attendance Types

| Type | Description | Created By |
|------|-------------|------------|
| `lecture` | Attendance for teaching a specific lecture | Cron job based on lecture schedule |
| `supervision` | Attendance for supervisor shift | Cron job based on SupervisorSchedule |

An instructor can have **both** types on the same day:
- Teaching a lecture at 9 AM
- Supervision duty from 11 AM to 2 PM

Each gets a separate attendance record with independent rating.

---

## Status Flow

```
                    ┌──────────────────┐
                    │   NOT_STARTED    │
                    │ (Day not started)│
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    PRESENT       │  │     LATE         │  │    ABSENT        │
│ (On-time check-in│  │ (Late check-in)  │  │ (No check-in)    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
          │                  │
          └──────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  Can be rated    │
          │  (1.00 - 10.00)  │
          └──────────────────┘
```

| Status | Description | Rating |
|--------|-------------|--------|
| `not_started` | Attendance record created, day hasn't started | `null` |
| `pending` | Awaiting check-in | `null` |
| `present` | Checked in within grace period | `0.00` (not rated) or `1-10` |
| `late` | Checked in after grace period | `0.00` (not rated) or `1-10` |
| `absent` | Did not check in | `null` |

---

## Rating System

| Rating Value | Meaning |
|--------------|---------|
| `null` | Cannot be rated (absent/not started) |
| `0.00` | Attended but not rated yet |
| `1.00 - 10.00` | Actual performance rating |

**Rules:**
- Only `PRESENT` or `LATE` attendance can be rated
- Rating can be updated multiple times (last one wins)
- `rated_by` and `rated_at` track who rated and when

---

## Endpoints

### 0. Unified Fingerprint Scan (Recommended)

**⭐ This is the RECOMMENDED endpoint for fingerprint devices that don't distinguish between check-in and check-out actions.**

The system intelligently determines the action based on the current attendance state.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/scan/` |
| **Method** | `POST` |
| **Auth Required** | No (uses device_id) |

**Request Body:**

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
| `device_id` | string | Yes | ID of the attendance device |
| `timestamp` | datetime | No | Device timestamp (for offline sync). Defaults to server time |

**Logic Flow:**

```
Fingerprint Scan
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Is there a recent scan (< 2 minutes)?                          │
│   YES → Return "Scan ignored - too soon" (prevent duplicates)  │
│   NO  → Continue...                                            │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Are there attendance records for today?                        │
│   NO  → AUTO-CREATE based on schedules/lectures and CHECK-IN   │
│   YES → Continue...                                            │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Is instructor checked in?                                      │
│   NO  → CHECK-IN (mark as PRESENT or LATE)                     │
│   YES → Is checked out?                                        │
│         NO  → CHECK-OUT                                        │
│         YES → RE-ENTRY (clear check-out, allow return)         │
└─────────────────────────────────────────────────────────────────┘
```

**Response - Check-in (200 OK):**

```json
{
  "message": "Check-in successful",
  "action": "check_in",
  "instructor": "محمد أحمد",
  "scan_time": "2026-02-14T08:30:00+02:00",
  "check_in_time": "2026-02-14T08:30:00+02:00",
  "records": [
    {
      "id": 123,
      "type": "lecture",
      "status": "present"
    }
  ]
}
```

**Response - Check-out (200 OK):**

```json
{
  "message": "Check-out successful",
  "action": "check_out",
  "instructor": "محمد أحمد",
  "scan_time": "2026-02-14T14:30:00+02:00",
  "check_out_time": "2026-02-14T14:30:00+02:00",
  "records": [
    {
      "id": 123,
      "type": "lecture",
      "check_out_time": "2026-02-14T14:30:00+02:00"
    }
  ]
}
```

**Response - Auto-create and Check-in (201 Created):**

```json
{
  "message": "Auto-created attendance and checked in",
  "action": "auto_create_check_in",
  "instructor": "محمد أحمد",
  "scan_time": "2026-02-14T08:30:00+02:00",
  "records": [
    {
      "id": 125,
      "type": "supervision",
      "status": "present",
      "auto_created": true
    }
  ]
}
```

**Response - Re-entry (200 OK):**

```json
{
  "message": "Re-entry recorded - check-out cleared",
  "action": "re_entry",
  "instructor": "محمد أحمد",
  "scan_time": "2026-02-14T15:30:00+02:00",
  "records": [
    {
      "id": 123,
      "type": "lecture",
      "status": "present",
      "re_entry": true
    }
  ]
}
```

**Response - Ignored (Too Soon) (200 OK):**

```json
{
  "message": "Scan ignored - too soon after last scan",
  "instructor": "محمد أحمد",
  "last_scan": "2026-02-14T08:30:00+02:00",
  "min_interval_seconds": 120
}
```

**Error Responses:**

| Code | Response | Cause |
|------|----------|-------|
| 400 | `{"fingerprint_id": ["No instructor found with this fingerprint ID."]}` | Invalid fingerprint |
| 400 | `{"device_id": ["Invalid or inactive device."]}` | Invalid/inactive device |
| 400 | `{"error": "No active season found"}` | No active season to create attendance |

---

### 1. Fingerprint Check-in (Legacy)

Check in an instructor using fingerprint device.

> **Note:** Consider using the [Unified Fingerprint Scan](#0-unified-fingerprint-scan-recommended) endpoint instead. This endpoint requires pre-created attendance records and won't auto-create them.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/check-in/` |
| **Method** | `POST` |
| **Auth Required** | No (uses device_id) |

**Request Body:**

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
| `device_id` | string | Yes | ID of the attendance device |
| `method` | string | No | Check-in method: `fingerprint`, `rfid`, `qr_code`, `manual` |

**Success Response (200 OK):**

```json
{
  "message": "Check-in successful",
  "instructor": "محمد أحمد",
  "check_in_time": "2026-02-05T08:30:00+02:00",
  "records": [
    {
      "id": 123,
      "type": "lecture",
      "status": "present"
    },
    {
      "id": 124,
      "type": "supervision",
      "status": "late"
    }
  ]
}
```

**Already Checked In (200 OK):**

```json
{
  "message": "Already checked in",
  "instructor": "محمد أحمد",
  "check_in_time": "2026-02-05T08:30:00+02:00"
}
```

**Error Responses:**

| Code | Response | Cause |
|------|----------|-------|
| 400 | `{"fingerprint_id": ["No instructor found with this fingerprint ID."]}` | Invalid fingerprint |
| 400 | `{"device_id": ["Invalid or inactive device."]}` | Invalid/inactive device |
| 404 | `{"error": "No attendance records found for today"}` | No scheduled attendance |

---

### 2. Fingerprint Check-out (Legacy)

Check out an instructor using fingerprint device.

> **Note:** Consider using the [Unified Fingerprint Scan](#0-unified-fingerprint-scan-recommended) endpoint instead.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/check-out/` |
| **Method** | `POST` |
| **Auth Required** | No (uses device_id) |

**Request Body:**

```json
{
  "fingerprint_id": "FP123456",
  "device_id": "DEVICE001",
  "method": "fingerprint"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Check-out successful",
  "instructor": "محمد أحمد",
  "check_out_time": "2026-02-05T14:30:00+02:00",
  "records": [
    {
      "id": 123,
      "type": "lecture",
      "check_out_time": "2026-02-05T14:30:00+02:00"
    }
  ]
}
```

**Error Responses:**

| Code | Response | Cause |
|------|----------|-------|
| 400 | `{"error": "Must check in before checking out"}` | No prior check-in |

---

### 3. Today's Attendance List

Get all attendance records for today.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/today/` |
| **Method** | `GET` |
| **Auth Required** | ✅ Admin JWT |

**Headers:**

```
Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

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
  },
  {
    "id": 124,
    "instructor": 2,
    "instructor_name": "علي حسن",
    "date": "2026-02-05",
    "check_in_time": null,
    "check_out_time": null,
    "status": "not_started",
    "status_display": "لم يبدأ",
    "attendance_type": "supervision",
    "attendance_type_display": "إشراف",
    "rating": null
  }
]
```

---

### 4. Today's Summary

Get summary statistics for today's attendance.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/today/summary/` |
| **Method** | `GET` |
| **Auth Required** | ✅ Admin JWT |

**Success Response (200 OK):**

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

### 5. Attendance Detail

Get or update a specific attendance record.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/{id}/` |
| **Method** | `GET`, `PATCH` |
| **Auth Required** | ✅ Admin JWT |

**GET Success Response (200 OK):**

```json
{
  "id": 123,
  "instructor": 1,
  "instructor_name": "محمد أحمد",
  "instructor_type": "عادي / خارجي",
  "date": "2026-02-05",
  "check_in_time": "2026-02-05T08:30:00+02:00",
  "check_out_time": "2026-02-05T14:30:00+02:00",
  "check_in_method": "fingerprint",
  "check_out_method": "fingerprint",
  "status": "present",
  "status_display": "حاضر",
  "attendance_type": "lecture",
  "attendance_type_display": "محاضرة",
  "schedule": null,
  "schedule_info": null,
  "lecture": 45,
  "lecture_title": "محاضرة 5 - أساسيات البرمجة",
  "season": 1,
  "rating": "8.50",
  "rated_by": 1,
  "rated_by_name": "Admin User",
  "rated_at": "2026-02-05T15:00:00+02:00",
  "notes": "أداء ممتاز في الشرح"
}
```

---

### 6. Rate Attendance

Rate an instructor's attendance.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/{id}/rate/` |
| **Method** | `POST` |
| **Auth Required** | ✅ Admin JWT |

**Request Body:**

```json
{
  "rating": 8.5,
  "notes": "أداء ممتاز في الشرح"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | decimal | Yes | Rating value (1.00 - 10.00) |
| `notes` | string | No | Optional notes about the rating |

**Success Response (200 OK):**

```json
{
  "id": 123,
  "rating": "8.50",
  "rated_by": 1,
  "rated_by_name": "Admin User",
  "rated_at": "2026-02-05T15:00:00+02:00",
  "notes": "أداء ممتاز في الشرح",
  "...": "other fields..."
}
```

**Error Responses:**

| Code | Response | Cause |
|------|----------|-------|
| 400 | `{"error": "لا يمكن تقييم المعلم الذي لم يحضر..."}` | Trying to rate absent instructor |
| 400 | `{"rating": ["Ensure this value is greater than or equal to 1."]}` | Rating < 1 |
| 400 | `{"rating": ["Ensure this value is less than or equal to 10."]}` | Rating > 10 |

---

### 7. Manual Check-in

Manually check in an instructor (by admin).

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/{id}/manual-check-in/` |
| **Method** | `POST` |
| **Auth Required** | ✅ Admin JWT |

**Success Response (200 OK):**

```json
{
  "id": 123,
  "check_in_time": "2026-02-05T09:00:00+02:00",
  "check_in_method": "manual",
  "status": "present",
  "...": "other fields..."
}
```

---

### 8. Manual Check-out

Manually check out an instructor (by admin).

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/{id}/manual-check-out/` |
| **Method** | `POST` |
| **Auth Required** | ✅ Admin JWT |

**Success Response (200 OK):**

```json
{
  "id": 123,
  "check_out_time": "2026-02-05T14:00:00+02:00",
  "check_out_method": "manual",
  "...": "other fields..."
}
```

**Error Response (400):**

```json
{
  "error": "Cannot check out without checking in first."
}
```

---

### 9. Mark Absent

Mark an instructor as absent.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/{id}/mark-absent/` |
| **Method** | `POST` |
| **Auth Required** | ✅ Admin JWT |

**Success Response (200 OK):**

```json
{
  "id": 123,
  "status": "absent",
  "rating": null,
  "...": "other fields..."
}
```

---

### 10. Attendance by Date

Get attendance records for a specific date.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/date/{YYYY-MM-DD}/` |
| **Method** | `GET` |
| **Auth Required** | ✅ Admin JWT |

**Example:** `/api/attendance/date/2026-02-05/`

**Success Response (200 OK):**

```json
[
  {
    "id": 123,
    "instructor_name": "محمد أحمد",
    "status": "present",
    "...": "other fields..."
  }
]
```

---

### 11. Instructor History

Get attendance history for a specific instructor.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/instructor/{instructor_id}/` |
| **Method** | `GET` |
| **Auth Required** | ✅ Admin JWT |

**Success Response (200 OK):**

```json
[
  {
    "id": 125,
    "date": "2026-02-05",
    "status": "present",
    "rating": "8.50",
    "...": "other fields..."
  },
  {
    "id": 120,
    "date": "2026-02-04",
    "status": "late",
    "rating": "7.00",
    "...": "other fields..."
  }
]
```

---

### 12. Device Management

Manage attendance devices.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/devices/` |
| **Method** | `GET`, `POST` |
| **Auth Required** | ✅ Admin JWT |

**List Devices (GET):**

```json
[
  {
    "id": 1,
    "device_id": "DEVICE001",
    "name": "البوابة الرئيسية",
    "location": "المدخل الرئيسي",
    "is_active": true
  }
]
```

**Create Device (POST):**

```json
{
  "device_id": "DEVICE002",
  "name": "البوابة الخلفية",
  "location": "المدخل الخلفي",
  "is_active": true
}
```

**Single Device:** `/api/attendance/devices/{id}/` (GET, PATCH, DELETE)

---

### 13. Schedule Management

Manage supervisor schedules.

| Property | Value |
|----------|-------|
| **URL** | `/api/attendance/schedules/` |
| **Method** | `GET`, `POST` |
| **Auth Required** | ✅ Admin JWT |

**List Schedules (GET):**

```json
[
  {
    "id": 1,
    "instructor": 1,
    "instructor_name": "علي حسن",
    "day_of_week": 0,
    "day_display": "الأحد",
    "start_time": "08:00:00",
    "end_time": "14:00:00",
    "grace_period_minutes": 15,
    "auto_absent_after_minutes": 60
  }
]
```

**Create Schedule (POST):**

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

**Day of Week Values:**

| Value | Day |
|-------|-----|
| 0 | الأحد (Sunday) |
| 1 | الإثنين (Monday) |
| 2 | الثلاثاء (Tuesday) |
| 3 | الأربعاء (Wednesday) |
| 4 | الخميس (Thursday) |
| 5 | الجمعة (Friday) |
| 6 | السبت (Saturday) |

**Single Schedule:** `/api/attendance/schedules/{id}/` (GET, PATCH, DELETE)

---

### 14. Scan Logs

View fingerprint scan logs for audit trail and debugging.

| Property | Value |
|----------|-------|
| **URL** | `/Al-Redwan-superadmin-dashboard/attendance/fingerprintscanlog/` |
| **Method** | Web Admin Interface |
| **Auth Required** | ✅ Admin Login |

**Description:**

The `FingerprintScanLog` model tracks every fingerprint scan from devices, including:
- Check-ins
- Check-outs
- Re-entries (returning after check-out)
- Ignored scans (rapid duplicates)
- Auto-created attendance records

**Use Cases:**
- Debugging device issues
- Audit trail for attendance disputes
- Tracking unusual patterns (e.g., rapid scanning)
- Verifying offline sync data

**Admin Interface Features:**
- Filter by action type, device, date
- Search by instructor name
- Color-coded action display
- View scan time vs. received time (for offline sync)

---

## WebSocket Real-time Updates

### Connection

```
ws://localhost:8000/ws/attendance/?token=<jwt_access_token>
```

**Authentication:** Required (Admin JWT via query string)

### Connection Codes

| Code | Meaning |
|------|---------|
| Normal close | Disconnected normally |
| 4001 | No token provided |
| 4002 | Invalid token |
| 4003 | Not authorized (not staff) |

### Message Types

**Outgoing (Client → Server):**

```json
// Health check
{"type": "ping"}

// Request current summary
{"type": "request_summary"}
```

**Incoming (Server → Client):**

```json
// Connection established
{
  "type": "connection_established",
  "message": "Connected as Admin User",
  "user_id": 1
}

// Attendance update (check-in)
{
  "type": "attendance_update",
  "data": {
    "instructor": "محمد أحمد",
    "id": 123,
    "time": "2026-02-05T08:30:00+02:00",
    "status": "present",
    "date": "2026-02-05"
  }
}

// Check-out
{
  "type": "attendance_check_out",
  "data": {
    "instructor": "محمد أحمد",
    "id": 123,
    "check_out_time": "2026-02-05T14:30:00+02:00"
  }
}

// Rating added
{
  "type": "attendance_rated",
  "data": {
    "id": 123,
    "rating": 8.5,
    "rated_by": "Admin User"
  }
}

// Summary response
{
  "type": "summary_response",
  "data": {
    "date": "2026-02-05",
    "total_expected": 15,
    "checked_in": 10,
    "present": 8,
    "late": 2,
    "absent": 1
  }
}

// Pong (health check response)
{"type": "pong"}
```

### JavaScript Example

```javascript
class AttendanceWebSocket {
  constructor(accessToken) {
    this.token = accessToken;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.socket = new WebSocket(
      `ws://localhost:8000/ws/attendance/?token=${this.token}`
    );

    this.socket.onopen = () => {
      console.log('Connected to attendance updates');
      this.reconnectAttempts = 0;
      
      // Request initial summary
      this.requestSummary();
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.socket.onclose = (event) => {
      if (event.code === 4001) {
        console.error('No token provided');
      } else if (event.code === 4002) {
        console.error('Invalid token');
      } else if (event.code === 4003) {
        console.error('Not authorized');
      } else {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connection_established':
        console.log('Connected as:', message.message);
        break;
        
      case 'attendance_update':
        // Update UI with new check-in
        this.onCheckIn(message.data);
        break;
        
      case 'attendance_check_out':
        // Update UI with check-out
        this.onCheckOut(message.data);
        break;
        
      case 'attendance_rated':
        // Update UI with new rating
        this.onRated(message.data);
        break;
        
      case 'summary_response':
        // Update summary statistics
        this.onSummary(message.data);
        break;
        
      case 'pong':
        console.log('Server is alive');
        break;
    }
  }

  requestSummary() {
    this.socket.send(JSON.stringify({ type: 'request_summary' }));
  }

  ping() {
    this.socket.send(JSON.stringify({ type: 'ping' }));
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 3000);
    }
  }

  // Override these in your app
  onCheckIn(data) { console.log('Check-in:', data); }
  onCheckOut(data) { console.log('Check-out:', data); }
  onRated(data) { console.log('Rated:', data); }
  onSummary(data) { console.log('Summary:', data); }
}

// Usage
const ws = new AttendanceWebSocket('your-jwt-token');
ws.onCheckIn = (data) => {
  // Update your UI
  showNotification(`${data.instructor} checked in`);
};
ws.connect();
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not admin) |
| 404 | Not Found |
| 500 | Server Error |

### Error Response Format

```json
{
  "field_name": ["Error message 1", "Error message 2"],
  "error": "General error message"
}
```

---

## Best Practices

### For Device Integration

1. **Store device_id securely** on the fingerprint device
2. **Handle network failures** gracefully with retry logic
3. **Display success/failure** messages on device screen
4. **Log all transactions** for debugging

### For Admin Dashboard

1. **Use WebSocket** for real-time updates instead of polling
2. **Implement reconnection logic** for WebSocket disconnections
3. **Show loading states** while fetching data
4. **Confirm before marking absent** to prevent accidents

### For Rating

1. **Rate at end of day** when you can properly assess performance
2. **Update ratings if needed** (last one wins)
3. **Use notes** to explain exceptional ratings (very high or low)

---

## Related Documentation

- [System Logic Documentation](./logic.md) — Internal system logic and data flow
- [Authentication API](../../users/docs/authentication.md) — JWT authentication endpoints
