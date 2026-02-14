# Instructor Attendance System - Logic Documentation

This document explains the internal logic, data models, and business rules of the instructor attendance system.

---

## Table of Contents

- [Overview](#overview)
- [Data Models](#data-models)
  - [InstructorAttendance](#instructorattendance)
  - [SupervisorSchedule](#supervisorschedule)
  - [AttendanceDevice](#attendancedevice)
  - [AttendanceCronLog](#attendancecronlog)
  - [FingerprintScanLog](#fingerprintscanlog)
- [Enums](#enums)
- [Business Logic](#business-logic)
  - [Unified Scan Logic](#unified-scan-logic)
  - [Attendance Generation](#attendance-generation)
  - [Check-in Logic](#check-in-logic)
  - [Check-out Logic](#check-out-logic)
  - [Absent Marking](#absent-marking)
  - [Rating Logic](#rating-logic)
- [Constraints and Validations](#constraints-and-validations)
- [Cron Jobs](#cron-jobs)
- [WebSocket Broadcasting](#websocket-broadcasting)
- [Edge Cases](#edge-cases)

---

## Overview

The instructor attendance system manages two types of attendance:

1. **Lecture Attendance** — Created automatically when lectures are scheduled
2. **Supervision Attendance** — Created based on weekly supervisor schedules

The system integrates with fingerprint devices for check-in/check-out and provides real-time updates to an admin dashboard via WebSocket.

---

## Data Models

### InstructorAttendance

The main model tracking instructor attendance records.

```python
class InstructorAttendance(models.Model):
    # Core fields
    instructor = ForeignKey(Instructor)
    date = DateField()
    season = ForeignKey(Season)
    
    # Type of attendance
    attendance_type = CharField(choices=AttendanceType.choices)  # lecture/supervision
    lecture = ForeignKey(Lecture, null=True)  # Only for lecture type
    schedule = ForeignKey(SupervisorSchedule, null=True)  # Only for supervision type
    
    # Check-in/out tracking
    check_in_time = DateTimeField(null=True)
    check_out_time = DateTimeField(null=True)
    check_in_method = CharField(choices=CheckInMethod.choices)
    check_out_method = CharField(choices=CheckInMethod.choices)
    check_in_device = ForeignKey(AttendanceDevice)
    check_out_device = ForeignKey(AttendanceDevice)
    
    # Status
    status = CharField(choices=AttendanceStatus.choices)
    
    # Rating
    rating = DecimalField(null=True)  # null=can't rate, 0=not rated, 1-10=rated
    rated_by = ForeignKey(CustomUser, null=True)
    rated_at = DateTimeField(null=True)
    notes = TextField(null=True)
```

**Unique Constraints:**
- For lecture: `(instructor, lecture)` — One attendance per instructor per lecture
- For supervision: `(instructor, schedule, date)` — One attendance per schedule per day

### SupervisorSchedule

Weekly schedule for supervisor instructors.

```python
class SupervisorSchedule(models.Model):
    instructor = ForeignKey(Instructor)
    day_of_week = PositiveSmallIntegerField(choices=Weekday.choices)  # 0-6
    start_time = TimeField()
    end_time = TimeField()
    grace_period_minutes = PositiveIntegerField(default=20)
    auto_absent_after_minutes = PositiveIntegerField(default=60)
```

**Unique Constraint:** `(instructor, day_of_week)` — One schedule per instructor per day

### AttendanceDevice

Registered fingerprint/RFID devices.

```python
class AttendanceDevice(models.Model):
    device_id = CharField(unique=True)  # Hardware ID
    name = CharField()
    location = CharField(null=True)
    is_active = BooleanField(default=True)
```

### AttendanceCronLog

Logging for cron job executions.

```python
class AttendanceCronLog(models.Model):
    job_name = CharField()
    executed_at = DateTimeField(auto_now_add=True)
    details = TextField()
```

### FingerprintScanLog

Log of all fingerprint scans from devices for audit trail and debugging.

```python
class FingerprintScanLog(models.Model):
    attendance = ForeignKey(InstructorAttendance, null=True)  # May be null if creation failed
    instructor = ForeignKey(Instructor)
    scan_time = DateTimeField()           # Actual scan time (may differ from received_time for offline sync)
    received_time = DateTimeField()       # When server received the scan
    device = ForeignKey(AttendanceDevice)
    action = CharField(choices=ScanAction.choices)  # check_in, check_out, re_entry, ignored, auto_created
    is_processed = BooleanField()         # Whether this scan was applied to attendance
    notes = TextField(null=True)          # Reason for ignoring, etc.
    device_sequence = IntegerField(null=True)  # For offline sync ordering
```

**ScanAction Choices:**
| Action | Description |
|--------|-------------|
| `check_in` | Normal check-in |
| `check_out` | Normal check-out |
| `re_entry` | Return after already checked out |
| `ignored` | Rapid duplicate scan (< 2 minutes) |
| `auto_created` | Attendance was auto-created on this scan |

---

## Enums

### AttendanceStatus

```python
class AttendanceStatus(models.TextChoices):
    NOT_STARTED = "not_started"  # Day hasn't started
    PENDING = "pending"          # Awaiting check-in
    PRESENT = "present"          # Checked in on time
    LATE = "late"                # Checked in after grace period
    ABSENT = "absent"            # Did not check in
```

### AttendanceType

```python
class AttendanceType(models.TextChoices):
    LECTURE = "lecture"          # Teaching a lecture
    SUPERVISION = "supervision"  # Supervisor shift
```

### CheckInMethod

```python
class CheckInMethod(models.TextChoices):
    FINGERPRINT = "fingerprint"  # Fingerprint scan
    RFID = "rfid"                # RFID card
    MANUAL = "manual"            # Admin manual entry
    QR_CODE = "qr_code"          # QR code scan
```

---

## Business Logic

### Unified Scan Logic

The unified scan endpoint (`/api/attendance/scan/`) is the recommended way to handle fingerprint devices that don't distinguish between check-in and check-out actions.

```
┌─────────────────────────────────────────────────────────────────┐
│                   Unified Fingerprint Scan Flow                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Fingerprint Scan Received                                      │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Is there a scan in last 2 minutes?                      │   │
│  │   YES → Log as IGNORED, return "too soon"               │   │
│  │   NO  → Continue                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Any attendance records for today?                       │   │
│  │   NO  → AUTO-CREATE based on schedules/lectures         │   │
│  │         If none found, create general supervision       │   │
│  │         Mark as checked-in, log as AUTO_CREATED         │   │
│  │   YES → Continue                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Has any record NOT been checked in?                     │   │
│  │   YES → CHECK-IN all pending records                    │   │
│  │         Log as CHECK_IN                                  │   │
│  │   NO  → Continue                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Has any record been checked-in but NOT out?             │   │
│  │   YES → CHECK-OUT all pending records                   │   │
│  │         Log as CHECK_OUT                                 │   │
│  │   NO  → Continue                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ All records already checked out?                        │   │
│  │   YES → RE-ENTRY (clear check_out_time)                 │   │
│  │         Log as RE_ENTRY                                  │   │
│  │         (Allows instructor to return after break)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Auto-create attendance**: No need for pre-generated records
- **Duplicate prevention**: Rapid scans (< 2 min) are ignored
- **Re-entry support**: Instructors can leave and return
- **Offline sync**: Device can send timestamp for delayed processing
- **Full audit trail**: Every scan is logged

### Attendance Generation

Attendance records are generated by the weekly cron job.

```
┌─────────────────────────────────────────────────────────────────┐
│              Attendance Generation (Weekly Cron)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Get active season                                           │
│  2. For each day in the next 7 days:                           │
│                                                                  │
│     ┌─────────────────────────────────────────────────┐        │
│     │  SUPERVISION ATTENDANCE                          │        │
│     │  - Find SupervisorSchedules for this weekday    │        │
│     │  - Create InstructorAttendance for each         │        │
│     │  - Set attendance_type = SUPERVISION            │        │
│     │  - Link to schedule                             │        │
│     └─────────────────────────────────────────────────┘        │
│                                                                  │
│     ┌─────────────────────────────────────────────────┐        │
│     │  LECTURE ATTENDANCE                              │        │
│     │  - Find Lectures scheduled for this date        │        │
│     │  - Create InstructorAttendance for each         │        │
│     │  - Set attendance_type = LECTURE                │        │
│     │  - Link to lecture                              │        │
│     └─────────────────────────────────────────────────┘        │
│                                                                  │
│  3. Log created count to AttendanceCronLog                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Uses `get_or_create` to avoid duplicates
- Only creates if active season exists
- Skips lectures without assigned instructor

### Check-in Logic

```python
def mark_checked_in(self, device=None, method=CheckInMethod.FINGERPRINT):
    now = timezone.now()
    self.check_in_time = now
    self.check_in_device = device
    self.check_in_method = method

    # Determine status based on schedule
    if self.schedule:
        shift_start = combine(self.date, self.schedule.start_time)
        if now > shift_start + grace_period:
            self.status = LATE
        else:
            self.status = PRESENT
    else:
        # No schedule = treat as present
        self.status = PRESENT
    
    # Set rating to 0 (not rated yet)
    self.rating = Decimal('0.00')
    
    self.save()
    self.broadcast_update()
```

**Flow:**

```
Fingerprint Scan
      │
      ▼
┌─────────────────┐
│ Validate        │
│ fingerprint_id  │
│ device_id       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Find attendance │
│ records for     │
│ today           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Has schedule?   │────►│ Check if late   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Status=PRESENT  │     │ Status=LATE     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌─────────────────┐
         │ rating = 0.00   │
         │ (not rated yet) │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Broadcast via   │
         │ WebSocket       │
         └─────────────────┘
```

### Check-out Logic

```python
def mark_checked_out(self, device=None, method=CheckInMethod.FINGERPRINT):
    # Validate check-in exists
    if not self.check_in_time:
        raise ValidationError("Cannot check out without checking in first.")
    
    now = timezone.now()
    if now <= self.check_in_time:
        raise ValidationError("Check-out time must be after check-in time.")
    
    self.check_out_time = now
    self.check_out_device = device
    self.check_out_method = method
    self.save()
    self.broadcast_update()
```

### Absent Marking

Absent marking happens via cron job at end of day.

```python
def mark_absent(self):
    self.status = AttendanceStatus.ABSENT
    self.rating = None      # Cannot rate absent
    self.rated_by = None
    self.rated_at = None
    self.save()
```

**Cron Flow:**

```
23:59 Daily
      │
      ▼
┌─────────────────────────┐
│ Find all attendance     │
│ with status:            │
│ - NOT_STARTED           │
│ - PENDING               │
│ for today               │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ For each record:        │
│ mark_absent()           │
│ - status = ABSENT       │
│ - rating = null         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Log to AttendanceCronLog│
└─────────────────────────┘
```

### Rating Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rating Logic                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: NOT_STARTED, PENDING, ABSENT                           │
│  ├── Rating MUST be null                                        │
│  └── Cannot rate                                                │
│                                                                  │
│  Status: PRESENT, LATE                                          │
│  ├── Rating = null → Auto-set to 0.00 on save                  │
│  ├── Rating = 0.00 → Not rated yet (can be rated)              │
│  └── Rating = 1.00-10.00 → Actually rated                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```python
def add_rating(self, value, admin_user, notes=None):
    # Validate status allows rating
    if self.status in [ABSENT, NOT_STARTED, PENDING]:
        raise ValidationError("Cannot rate instructor who didn't attend")
    
    # Validate rating range
    if value < 1.00 or value > 10.00:
        raise ValidationError("Rating must be between 1.00 and 10.00")
    
    self.rating = value
    self.rated_by = admin_user
    self.rated_at = timezone.now()
    self.notes = notes
    self.save()
```

---

## Constraints and Validations

### Model-Level Constraints

1. **Unique Constraints:**
   - `unique_instructor_lecture_attendance`: One attendance per instructor per lecture
   - `unique_instructor_schedule_date_attendance`: One attendance per schedule per date

2. **Attendance Type Consistency:**
   - LECTURE type: `lecture` can be set, `schedule` must be null
   - SUPERVISION type: `schedule` can be set, `lecture` must be null

3. **Check-out Validation:**
   - Cannot check out without checking in first
   - Check-out time must be after check-in time

4. **Schedule Overlap Prevention:**
   - Schedules for same instructor on same day cannot overlap

### Rating Constraints

| Status | Rating Value | Allowed Operations |
|--------|--------------|-------------------|
| NOT_STARTED | `null` | Cannot set rating |
| PENDING | `null` | Cannot set rating |
| ABSENT | `null` | Cannot set rating |
| PRESENT | `0.00` or `1-10` | Can set/update rating |
| LATE | `0.00` or `1-10` | Can set/update rating |

---

## Cron Jobs

### generate_instructor_attendance_weekly

**Schedule:** Every Sunday at 00:05 AM

**Purpose:** Generate attendance records for the next 7 days

```python
def generate_instructor_attendance_weekly():
    today = timezone.localdate()
    start = today
    end = today + timedelta(days=7)
    
    created_count = InstructorAttendance.generate_for_date_range(start, end)
    
    AttendanceCronLog.objects.create(
        job_name="generate_attendance_weekly",
        details=f"Created {created_count} attendance records from {start} to {end}"
    )
```

### mark_absent_daily

**Schedule:** Daily at 23:59

**Purpose:** Mark all pending/not_started as absent at end of day

```python
def mark_absent_daily():
    today = timezone.localdate()
    
    qs = InstructorAttendance.objects.filter(
        date=today,
        status__in=[PENDING, NOT_STARTED]
    )
    
    for attendance in qs:
        attendance.mark_absent()
    
    AttendanceCronLog.objects.create(
        job_name="mark_absent_daily",
        details=f"Marked {count} instructors as ABSENT for {today}"
    )
```

### mark_absent_for_yesterday

**Schedule:** Daily at 00:01 AM

**Purpose:** Fallback to catch any records missed by the 23:59 job

### update_pending_to_not_started

**Schedule:** Daily at 06:00 AM

**Purpose:** Log expected attendance count for monitoring

---

## WebSocket Broadcasting

When attendance is updated, changes are broadcast to connected admin clients.

```python
def broadcast_update(self):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "attendance_live",
        {
            "type": "attendance_update",
            "data": {
                "instructor": self.instructor.user.get_full_name(),
                "id": self.id,
                "time": str(self.check_in_time),
                "status": self.status,
                "date": str(self.date),
            },
        },
    )
```

**Group:** `attendance_live`

**Message Types:**
- `attendance_update` — Check-in/status change
- `attendance_check_out` — Check-out
- `attendance_rated` — Rating added

---

## Edge Cases

### 1. Instructor Has Both Lecture and Supervision on Same Day

**Scenario:** Instructor teaches at 9 AM and has supervision from 11 AM - 2 PM.

**Handling:**
- Two separate `InstructorAttendance` records are created
- One fingerprint check-in marks ALL records for that day
- Each record can be rated independently

### 2. Instructor Checks In Before Schedule Starts

**Scenario:** Schedule starts at 8:00 AM, instructor checks in at 7:30 AM.

**Handling:**
- Status = PRESENT (on time)
- Check-in time recorded as 7:30 AM

### 3. Instructor Forgets to Check Out

**Scenario:** Instructor checks in but never checks out.

**Handling:**
- Check-out time remains null
- Does NOT affect status or rating
- Admin can manually check out if needed

### 4. Device Sends Duplicate Check-in

**Scenario:** Network issue causes device to retry check-in.

**Handling:**
- Second request returns `{"message": "Already checked in"}`
- No duplicate records created

### 5. No Active Season

**Scenario:** Cron runs but no season is active.

**Handling:**
- `generate_for_date_range()` returns 0
- No attendance records created
- Cron log shows 0 created

### 6. Instructor Without Fingerprint ID

**Scenario:** New instructor not yet registered with fingerprint.

**Handling:**
- Device check-in fails with "No instructor found with this fingerprint ID"
- Admin can use manual check-in endpoint

### 7. Rating Already Given, Admin Wants to Update

**Scenario:** Admin rated 7.0, wants to change to 8.5.

**Handling:**
- `add_rating()` can be called multiple times
- Last rating wins
- `rated_at` is updated to current time

---

## Database Indexes

For optimal query performance:

```python
indexes = [
    Index(fields=["instructor", "date"]),      # Common query pattern
    Index(fields=["season"]),                   # Season-based queries
    Index(fields=["rated_by"]),                 # Find ratings by admin
    Index(fields=["attendance_type"]),          # Filter by type
    Index(fields=["status", "date"]),           # Dashboard filters
]
```

---

## Testing

Run the test suite:

```bash
# All attendance tests
python manage.py test attendance

# Specific test modules
python manage.py test attendance.tests.test_models
python manage.py test attendance.tests.test_api
python manage.py test attendance.tests.test_cron

# With verbosity
python manage.py test attendance -v 2
```

---

## Related Documentation

- [API Documentation](./api.md) — REST API endpoints
- [Authentication](../../users/docs/authentication.md) — JWT authentication
