# ⚙️ Signals & Auto Lecture Generation

> **Internal documentation** — This describes backend logic, not API endpoints.

Automatic lecture generation based on course schedules via Django signals.

---

## Overview

When a `CourseSchedule` is created, updated, or deleted, the system **regenerates all future lectures** for the associated course while **preserving past lectures**.

---

## Signal Handlers

| Signal | Trigger | Action |
|--------|---------|--------|
| `post_save` on `CourseSchedule` | Schedule created or updated | Regenerate future lectures |
| `post_delete` on `CourseSchedule` | Schedule deleted | Regenerate future lectures (without deleted schedule) |

Both handlers call `_regenerate_future_lectures_for_course(course)`.

---

## Weekday Conversion

The system uses a custom weekday enum that differs from Python's `weekday()`:

| System | Day | Python |
|--------|-----|--------|
| 0 | Saturday | 5 |
| 1 | Sunday | 6 |
| 2 | Monday | 0 |
| 3 | Tuesday | 1 |
| 4 | Wednesday | 2 |
| 5 | Thursday | 3 |
| 6 | Friday | 4 |

**Formula:** `(system_weekday + 5) % 7`

---

## Regeneration Logic

Runs inside an **atomic database transaction** for data consistency.

### Step-by-Step

1. **Get generation window** — `start_date`, `end_date`, `num_lectures`
2. **Exit early** if neither `end_date` nor `num_lectures` is set
3. **Delete future lectures** — all lectures where `day >= today`
4. **Group schedules** by weekday, sorted by `start_time`
5. **Count past lectures** — next number = `past_count + 1`
6. **Calculate remaining** — if `num_lectures` mode: `remaining = target - past_count`
7. **Set fallback end date** — if no `end_date`, use 2 years from start
8. **Generate lectures** — iterate dates, create lecture for each matching schedule
9. **Skip today's past lectures** — if start_time + 5 min has already passed

---

## Case Handling

### Course with `end_date` only

Generates all future lectures up to `end_date`. Multiple schedules on the same weekday create multiple lectures per day.

### Course with `num_lectures` only

Generates up to the target count minus existing past lectures. Uses 2-year cap as safety limit.

### Course with both

**Whichever limit is reached first wins.**

### Course with neither

No lectures generated (exits early).

### No schedules defined

All future lectures deleted, none regenerated.

### Schedule deletion

Future lectures for that day are removed. If the last schedule is deleted, all future lectures are removed.

### Today's lectures

- Start time in the future → lecture **created**
- Start time + 5 min passed → lecture **skipped**
- No start time defined → lecture **created**

---

## Lecture Numbering

Sequential across the entire course (past + future):

1. Count all past lectures (day < today)
2. New lectures start from `past_count + 1`

**Example:** 5 past lectures exist → next 3 generated are numbered 6, 7, 8.

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
            │
            ▼
    Both end_date AND num_lectures are None? ──Yes──► Exit
            │ No
            ▼
    Delete Future Lectures (day >= today)
            │
            ▼
    Any schedules exist? ──No──► Exit
            │ Yes
            ▼
    Group Schedules by Weekday, Sort by start_time
            │
            ▼
    Count Past Lectures → next_number = past_count + 1
            │
            ▼
    remaining <= 0? ──Yes──► Exit
            │ No
            ▼
    Iterate through date range
    For each date:
      - Check if weekday has schedule
      - Skip if today & time passed
      - Create Lecture
      - Increment lecture_number
      - Check if limit reached
            │
            ▼
    Commit Transaction
```

---

## Performance Notes

| Operation | Impact |
|-----------|--------|
| Single schedule change | Regenerates ALL future lectures for the course |
| Course with many future lectures | Higher database load during regeneration |
| Multiple schedule updates | Each triggers full regeneration |

**Recommendations:** Batch schedule changes when possible. Consider a manual "regenerate" action for bulk updates.

---

## Commented-Out Code: Auto LectureAttendance

The signals file contains a commented-out handler that would create `LectureAttendance` records for all enrolled students/children when a lecture is created. Currently disabled.
