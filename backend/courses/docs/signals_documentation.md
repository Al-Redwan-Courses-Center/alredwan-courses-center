# Course Signals Documentation

This document explains how the `signals.py` file in the courses app works. It handles **automatic lecture generation** based on course schedules.

---

## Overview

The signals module automatically generates and manages lectures for courses based on their schedules. When a `CourseSchedule` is created, updated, or deleted, the system regenerates all **future** lectures for the associated course while preserving **past** lectures.

---

## Key Components

### 1. Weekday Conversion

```python
def _system_weekday_to_python(system_weekday: int) -> int
```

**Purpose:** Converts the system's custom `Weekday` enum format to Python's standard `weekday()` format.

| System Weekday | Day       | Python Weekday |
|----------------|-----------|----------------|
| 0              | Saturday  | 5              |
| 1              | Sunday    | 6              |
| 2              | Monday    | 0              |
| 3              | Tuesday   | 1              |
| 4              | Wednesday | 2              |
| 5              | Thursday  | 3              |
| 6              | Friday    | 4              |

**Formula:** `(system_weekday + 5) % 7`

---

### 2. Date Iteration Helper

```python
def _iterate_dates(start_date, end_date)
```

**Purpose:** Generator function that yields each date from `start_date` to `end_date` (inclusive).

---

### 3. Generation Window Calculator

```python
def _get_course_generation_window(course: Course)
```

**Purpose:** Determines the date range for lecture generation.

**Returns:** `(start_date, end_date, num_lectures)`

| Parameter      | Description                                                    |
|----------------|----------------------------------------------------------------|
| `start_date`   | The later of today's date or `course.start_date`               |
| `end_date`     | `course.end_date` (may be `None`)                              |
| `num_lectures` | Target number of lectures if specified (may be `None`)         |

---

## Main Regeneration Logic

```python
def _regenerate_future_lectures_for_course(course: Course)
```

This is the core function that handles lecture regeneration. It runs inside an **atomic database transaction** to ensure data consistency.

### Step-by-Step Process

#### Step 1: Determine Generation Window
- Gets `start_date`, `end_date`, and `target_num` (number of lectures)
- If **neither** `end_date` nor `target_num` is set → **exits early** (nothing to generate)

#### Step 2: Delete Future Lectures
- Deletes all lectures where `day >= today`
- **Past lectures are preserved** (day < today)

#### Step 3: Load and Organize Schedules
- Fetches all `CourseSchedule` objects for the course
- Groups schedules by Python weekday
- Sorts schedules on the same weekday by `start_time` (ascending)

#### Step 4: Calculate Starting Lecture Number
- Counts existing past lectures
- New lectures start numbering from `past_count + 1`

#### Step 5: Calculate Remaining Lectures (if applicable)
- If `target_num` is set: `remaining = target_num - past_count`
- If remaining ≤ 0 → **exits early** (target already met by past lectures)

#### Step 6: Set End Date Fallback
- If `end_date` is `None` but `remaining` is set → uses 2 years from start as upper bound

#### Step 7: Generate Lectures
- Iterates through each date in the range
- For each date, checks if any schedule matches that weekday
- Creates a lecture for each matching schedule

#### Step 8: Skip Today's Past Lectures
- If generating for today and the lecture's start time + 5 minutes has already passed → **skips** that lecture

---

## Case Handling Matrix

### Case 1: Course with `end_date` Only

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| Schedule created/updated                      | Regenerates all future lectures up to `end_date`            |
| Multiple schedules on same weekday            | Creates multiple lectures per day, ordered by `start_time`  |

**Example:**
- Course: Jan 1 - Jan 31
- Schedule: Monday & Wednesday at 10:00 AM
- Result: Lectures created for every Monday and Wednesday in January

---

### Case 2: Course with `num_lectures` Only

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| 10 lectures needed, 3 past exist              | Generates 7 more future lectures                            |
| All lectures already in the past              | No new lectures generated                                   |
| No end_date                                   | Uses 2-year cap as safety limit                             |

**Example:**
- Course: `num_lectures = 20`, no `end_date`
- 5 past lectures exist
- Result: Generates next 15 lectures based on schedule pattern

---

### Case 3: Course with Both `end_date` and `num_lectures`

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| `num_lectures` reached before `end_date`      | Stops at `num_lectures`                                     |
| `end_date` reached before `num_lectures`      | Stops at `end_date`                                         |

**Whichever limit is reached first wins.**

---

### Case 4: Course with Neither `end_date` nor `num_lectures`

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| No constraints set                            | **No lectures generated** (exits early)                     |

---

### Case 5: No Schedules Defined

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| Course has no `CourseSchedule` objects        | Future lectures deleted, none regenerated                   |

---

### Case 6: Schedule Deletion

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| Schedule for Monday deleted                   | All future Monday lectures removed                          |
| Last schedule deleted                         | All future lectures removed                                 |

---

### Case 7: Today's Lectures

| Scenario                                      | Behavior                                                    |
|-----------------------------------------------|-------------------------------------------------------------|
| Lecture start time is in the future           | Lecture **created**                                         |
| Lecture start time + 5 min has passed         | Lecture **skipped** (treated as past)                       |
| No `start_time` defined on schedule           | Lecture **created**                                         |

---

## Signal Handlers

### `on_schedule_saved`

**Triggered by:** `post_save` signal on `CourseSchedule`

**Behavior:**
- Fires when a schedule is **created** or **updated**
- Calls `_regenerate_future_lectures_for_course()` for the related course

```python
@receiver(post_save, sender=CourseSchedule)
def on_schedule_saved(sender, instance: CourseSchedule, created, **kwargs):
    course = instance.course
    _regenerate_future_lectures_for_course(course)
```

---

### `on_schedule_deleted`

**Triggered by:** `post_delete` signal on `CourseSchedule`

**Behavior:**
- Fires when a schedule is **deleted**
- Calls `_regenerate_future_lectures_for_course()` for the related course

```python
@receiver(post_delete, sender=CourseSchedule)
def on_schedule_deleted(sender, instance: CourseSchedule, **kwargs):
    course = instance.course
    _regenerate_future_lectures_for_course(course)
```

---

## Lecture Numbering

Lecture numbers are **sequential across the entire course**, combining past and future lectures:

1. Count all past lectures (day < today)
2. Start new lecture numbering from `past_count + 1`
3. Each new lecture gets the next sequential number

**Example:**
- 5 past lectures exist (numbered 1-5)
- 3 new lectures generated (numbered 6, 7, 8)

---

## Database Transaction Safety

The `_regenerate_future_lectures_for_course` function uses `@transaction.atomic` decorator:

- All delete and create operations happen in a single transaction
- If any error occurs, all changes are rolled back
- Ensures data consistency even during failures

---

## Commented Code: Attendance Auto-Creation

The file contains commented-out code for automatic `LectureAttendance` creation:

```python
# @receiver(post_save, sender=Lecture)
# def create_lecture_attendance_on_lecture_create(...)
```

**If enabled, this would:**
- Create `LectureAttendance` records for all enrolled students/children when a lecture is created
- Currently disabled (commented out)

---

## Performance Considerations

| Operation                          | Impact                                                      |
|------------------------------------|-------------------------------------------------------------|
| Single schedule change             | Regenerates ALL future lectures for the course              |
| Course with many future lectures   | Higher database load during regeneration                    |
| Multiple schedule updates          | Each triggers full regeneration                             |

**Recommendations:**
- Batch schedule changes when possible
- Consider adding a manual "regenerate" action for bulk updates
- Monitor database performance for courses with long durations

---

## Flowchart

```
Schedule Created/Updated/Deleted
            │
            ▼
    Get Course Instance
            │
            ▼
    Enter Atomic Transaction
            │
            ▼
    Get Generation Window
    (start_date, end_date, num_lectures)
            │
            ▼
    ┌───────────────────────┐
    │ Both end_date AND     │──Yes──► Exit (nothing to generate)
    │ num_lectures are None?│
    └───────────────────────┘
            │ No
            ▼
    Delete Future Lectures
    (day >= today)
            │
            ▼
    ┌───────────────────────┐
    │ Any schedules exist?  │──No───► Exit
    └───────────────────────┘
            │ Yes
            ▼
    Group Schedules by Weekday
    Sort by start_time
            │
            ▼
    Count Past Lectures
    Set next_number = past_count + 1
            │
            ▼
    Calculate remaining (if num_lectures mode)
            │
            ▼
    ┌───────────────────────┐
    │ remaining <= 0?       │──Yes──► Exit
    └───────────────────────┘
            │ No
            ▼
    Iterate through date range
            │
            ▼
    ┌─────────────────────────────────┐
    │ For each date:                  │
    │  - Check if weekday has schedule│
    │  - Skip if today & time passed  │
    │  - Create Lecture               │
    │  - Increment lecture_number     │
    │  - Check if limit reached       │
    └─────────────────────────────────┘
            │
            ▼
    Commit Transaction
```

---

## Summary

| Trigger                  | Action                                              |
|--------------------------|-----------------------------------------------------|
| Schedule created         | Regenerate future lectures                          |
| Schedule updated         | Regenerate future lectures                          |
| Schedule deleted         | Regenerate future lectures (without deleted schedule)|
| Past lectures            | Always preserved                                    |
| Future lectures          | Always deleted and regenerated                      |
| Lecture numbering        | Sequential across past + new lectures               |
