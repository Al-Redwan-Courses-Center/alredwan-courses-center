# ⚙️ Attendance System Logic

> **Internal documentation** — This describes backend business rules and data models, not API endpoints.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [Enums](#enums)
4. [Business Logic](#business-logic)
5. [Constraints & Validations](#constraints--validations)
6. [Cron Jobs](#cron-jobs)
7. [WebSocket Broadcasting](#websocket-broadcasting)
8. [Edge Cases](#edge-cases)

---

## Overview

The instructor attendance system manages two types of attendance:

| Type | Source | Created By |
|------|--------|------------|
| **Lecture** | Course schedule → Lectures | Cron job (weekly) |
| **Supervision** | SupervisorSchedule | Cron job (weekly) |

Integrates with fingerprint devices for check-in/check-out and broadcasts real-time updates via WebSocket.

---

## Data Models

### InstructorAttendance

```
instructor          → Instructor (FK)
date                → DateField
season              → Season (FK)
attendance_type     → lecture | supervision
lecture             → Lecture (FK, nullable)       # Only for lecture type
schedule            → SupervisorSchedule (FK, nullable) # Only for supervision type
check_in_time       → DateTimeField (nullable)
check_out_time      → DateTimeField (nullable)
check_in_method     → fingerprint | rfid | manual | qr_code
check_out_method    → fingerprint | rfid | manual | qr_code
check_in_device     → AttendanceDevice (FK)
check_out_device    → AttendanceDevice (FK)
status              → not_started | pending | present | late | absent
rating              → Decimal (nullable)  # null=can't rate, 0=not rated, 1-10=rated
rated_by            → CustomUser (FK, nullable)
rated_at            → DateTimeField (nullable)
notes               → TextField (nullable)
```

**Unique constraints:**
- Lecture type: `(instructor, lecture)`
- Supervision type: `(instructor, schedule, date)`

### SupervisorSchedule

```
instructor              → Instructor (FK)
day_of_week             → 0-6 (Weekday)
start_time              → TimeField
end_time                → TimeField
grace_period_minutes    → default 20
auto_absent_after_minutes → default 60
```

**Unique constraint:** `(instructor, day_of_week)`

### AttendanceDevice

```
device_id   → CharField (unique hardware ID)
name        → CharField
location    → CharField (nullable)
is_active   → BooleanField (default True)
```

### AttendanceCronLog

```
job_name     → CharField
executed_at  → DateTimeField (auto)
details      → TextField
```

### FingerprintScanLog

Audit trail for every raw fingerprint scan from a device, regardless of the action the system took.

```
attendance       → InstructorAttendance (FK, nullable)  # null if creation failed
instructor       → Instructor (FK)
scan_time        → DateTimeField                        # device timestamp (offline-sync aware)
received_time    → DateTimeField (auto)                 # server arrival time
device           → AttendanceDevice (FK, nullable)
action           → ScanAction (see Enums)
is_processed     → BooleanField (default True)
notes            → TextField (nullable)
device_sequence  → IntegerField (nullable)              # for ordering offline-batch scans
```

### WebSocketTicket

Short-lived, single-use token that authenticates a WebSocket connection without exposing a JWT in the URL.

```
token       → CharField (unique, auto-generated, 64 chars)
user        → CustomUser (FK)
created_at  → DateTimeField (auto)
expires_at  → DateTimeField (default: now + 30 s)
used_at     → DateTimeField (nullable)
is_used     → BooleanField (default False)
ip_address  → GenericIPAddressField (nullable)
user_agent  → CharField (nullable)
```

---

## Enums

### AttendanceStatus

| Value | Description |
|-------|-------------|
| `not_started` | Day hasn't started |
| `pending` | Awaiting check-in |
| `present` | Checked in on time |
| `late` | Checked in after grace period |
| `absent` | Did not check in |

### AttendanceType

| Value | Description |
|-------|-------------|
| `lecture` | Teaching a lecture |
| `supervision` | Supervisor shift |

### CheckInMethod

| Value | Description |
|-------|-------------|
| `fingerprint` | Fingerprint scan |
| `rfid` | RFID card |
| `manual` | Admin manual entry |
| `qr_code` | QR code scan |

### ScanAction

System-determined outcome logged in `FingerprintScanLog` for every scan.

| Value | Description |
|-------|-------------|
| `check_in` | Scan recorded as check-in |
| `check_out` | Scan recorded as check-out |
| `re_entry` | Re-entry after check-out (check-out cleared) |
| `ignored` | Duplicate scan (< 2 min since last scan) |
| `auto_created` | Attendance record auto-created before check-in |

---

## Business Logic

### Attendance Generation (Weekly Cron)

1. Get active season
2. For each day in the next 7 days:
   - Find `SupervisorSchedule` entries for this weekday → create `InstructorAttendance` (supervision)
   - Find `Lecture` entries for this date → create `InstructorAttendance` (lecture)
3. Uses `get_or_create` to avoid duplicates
4. Skips lectures without assigned instructor
5. Logs to `AttendanceCronLog`

### Unified Scan Flow (Recommended)

The `/api/attendance/scan/` endpoint auto-determines the action from the current attendance state.

```
Fingerprint Scan → Validate fingerprint_id + device_id
      → Log scan to FingerprintScanLog
      → Rapid scan? (< 2 min since last scan) → action=IGNORED, return
      → No attendance record for today → auto-create + check-in (action=AUTO_CREATED)
      → Has record, not checked in → check-in (action=CHECK_IN)
      → Checked in, not checked out → check-out (action=CHECK_OUT)
      → Already checked out → re-entry: clear check-out (action=RE_ENTRY)
      → Broadcast via WebSocket
```

### Check-in Flow (Legacy)

```
Fingerprint Scan → Validate fingerprint_id + device_id
      → Find attendance records for today
      → Has schedule? → Check grace period → PRESENT or LATE
      → No schedule → PRESENT
      → Set rating = 0.00 (not rated yet)
      → Broadcast via WebSocket
```

### Check-out Flow (Legacy)

- Validates check-in exists (cannot check out without checking in)
- Check-out time must be after check-in time
- Records device and method
- Broadcasts via WebSocket

### Absent Marking (Daily Cron at 23:59)

```
Find all attendance with status PENDING or NOT_STARTED for today
  → mark_absent()
  → status = ABSENT
  → rating = null (cannot rate absent)
```

### Rating Logic

| Status | Rating Value | Can Rate? |
|--------|--------------|-----------|
| `not_started` | `null` | ❌ |
| `pending` | `null` | ❌ |
| `absent` | `null` | ❌ |
| `present` | `0.00` → `1-10` | ✅ |
| `late` | `0.00` → `1-10` | ✅ |

- Rating range: 1.00 – 10.00
- Can be updated multiple times (last one wins)
- Tracks `rated_by`, `rated_at`, and optional `notes`

---

## Constraints & Validations

1. **Unique constraints** prevent duplicate attendance records
2. **Type consistency:** Lecture type → `lecture` field set, `schedule` null; Supervision type → vice versa
3. **Check-out validation:** Must have check-in first, must be after check-in time
4. **Schedule overlap prevention:** Same instructor, same day cannot have overlapping schedules

---

## Cron Jobs

### Instructor Attendance Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `generate_instructor_attendance_weekly` | Sunday 00:05 | Generate attendance records for next 7 days |
| `mark_absent_daily` | Daily 23:59 | Mark pending/not_started as absent |
| `mark_absent_for_yesterday` | Daily 00:01 | Fallback for missed records |
| `update_pending_to_not_started` | Daily 06:00 | Log expected attendance for monitoring |

### Lecture Cancellation Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `mark_lectures_without_attendance_as_cancelled` | Daily 23:55 | Mark past lectures without attendance as CANCELLED |
| `mark_lectures_without_attendance_as_cancelled_fallback` | Daily 00:05 | Fallback for 2+ day old lectures |

**Lecture Cancellation Logic:**

```
For each lecture where:
  - day ≤ yesterday (lecture date has passed)
  - status = SCHEDULED
  - attendance_taken = False

Action:
  - Set status = CANCELLED
  - Log to AttendanceCronLog with lecture details
```

**Why two jobs?**

1. **Primary job (23:55):** Runs before midnight to cancel yesterday's lectures
2. **Fallback job (00:05):** Catches lectures from 2+ days ago that were missed (server downtime, job failure, etc.)

**Edge cases handled:**

| Scenario | Behavior |
|----------|----------|
| Today's lecture | Not cancelled (might still be ongoing) |
| Lecture with `attendance_taken=True` | Not cancelled |
| Already COMPLETED lecture | Not cancelled |
| Already CANCELLED lecture | No change |
| ADDITIONAL lecture without attendance | Marked CANCELLED |

All jobs log results to `AttendanceCronLog`.

---

## WebSocket Broadcasting

When attendance is updated, changes are broadcast to the `attendance_live` group.

| Event | Trigger |
|-------|---------|
| `attendance_update` | Check-in / status change |
| `attendance_check_out` | Check-out |
| `attendance_rated` | Rating added |

See [WebSocket documentation](../websocket.md) for client-side integration.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| **Both lecture and supervision on same day** | Two separate records; one check-in marks ALL records |
| **Checks in before schedule starts** | Status = PRESENT |
| **Forgets to check out** | Check-out remains null; doesn't affect status/rating; admin can manually check out |
| **Device sends duplicate check-in** | Returns "Already checked in"; no duplicates |
| **No active season** | Cron creates 0 records |
| **Instructor without fingerprint ID** | Device check-in fails; use admin manual check-in |
| **Admin updates existing rating** | Last rating wins; `rated_at` updated |
| **Lecture attendance not taken** | Auto-cancelled by cron job the next day; logged for audit |
| **Lecture manually cancelled before cron** | Cron skips it (status != SCHEDULED) |

---

## Database Indexes

```python
indexes = [
    Index(fields=["instructor", "date"]),
    Index(fields=["season"]),
    Index(fields=["rated_by"]),
    Index(fields=["attendance_type"]),
    Index(fields=["status", "date"]),
]
```
