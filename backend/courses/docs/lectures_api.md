# Lecture Management API Documentation

## Overview
This document describes the API endpoints for managing lectures within courses. All endpoints require authentication and proper permissions (Admin, Supervisor, or Course Instructor).

---

## Table of Contents
1. [List & Create Lectures](#1-list--create-lectures)
2. [Check Lecture DateTime Availability](#2-check-lecture-datetime-availability)
3. [Update Lecture](#3-update-lecture)

---

## 1. List & Create Lectures

### Endpoint
```
GET  /api/courses/<course_id>/lectures/
POST /api/courses/<course_id>/lectures/
```

### Authentication
Required: Admin, Supervisor, or Course Instructor

### GET: List Lectures

#### Description
Returns all **accepted** lectures for a specific course, ordered by lecture number.

#### Query Parameters (Filters)
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `start_date` | Date (YYYY-MM-DD) | Filter lectures on or after this date | `2026-02-01` |
| `end_date` | Date (YYYY-MM-DD) | Filter lectures on or before this date | `2026-02-28` |
| `status` | String | Filter by lecture status | `scheduled`, `completed`, `cancelled`, `additional` |
| `instructor` | Integer | Filter by instructor ID | `5` |
| `attendance_taken` | Boolean | Filter by attendance status | `true` or `false` |
| `page` | Integer | Page number for pagination | `1` |
| `page_size` | Integer | Number of results per page (default: 10, max: 100) | `20` |

#### Example Requests
```bash
# Get all accepted lectures for course 1
GET /api/courses/1/lectures/

# Filter by date range
GET /api/courses/1/lectures/?start_date=2026-02-01&end_date=2026-02-28

# Filter by status and instructor
GET /api/courses/1/lectures/?status=scheduled&instructor=5

# Filter lectures where attendance hasn't been taken
GET /api/courses/1/lectures/?attendance_taken=false&page=1&page_size=20

# Complex filter
GET /api/courses/1/lectures/?start_date=2026-02-01&status=scheduled&attendance_taken=false
```

#### Response (200 OK)
```json
{
  "count": 15,
  "next": "http://api.example.com/api/courses/1/lectures/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-here",
      "lecture_number": 1,
      "title": "Introduction to Python",
      "day": "2026-02-15",
      "scheduled_at": "2026-02-15T10:00:00+02:00",
      "start_time": "10:00:00",
      "end_time": "12:00:00",
      "instructor": {
        "id": "uuid-here",
        "full_name": "John Doe"
      },
      "status": "scheduled",
      "status_display": "Scheduled",
      "is_accepted": true,
      "attendance_taken": false,
      "created_at": "2026-01-15T08:30:00Z",
      "updated_at": "2026-01-15T08:30:00Z"
    }
  ]
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique lecture identifier |
| `lecture_number` | Integer | Sequential lecture number |
| `title` | String | Lecture title |
| `day` | Date | Lecture date (YYYY-MM-DD) |
| `scheduled_at` | DateTime | ISO 8601 datetime for lecture start |
| `start_time` | Time | Lecture start time (HH:MM:SS) |
| `end_time` | Time | Lecture end time (HH:MM:SS) |
| `instructor` | Object | Instructor details |
| `status` | String | Lecture status code |
| `status_display` | String | Human-readable status |
| `is_accepted` | Boolean | Whether lecture is approved |
| `attendance_taken` | Boolean | Whether attendance has been recorded |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

---

### POST: Create Additional Lecture

#### Description
Creates a new **ADDITIONAL** lecture with `is_accepted=False` (requires approval). All users (Admin/Supervisor/Instructor) create additional lectures that need approval.

The lecture number is automatically calculated based on the date and time of the lecture relative to existing accepted lectures.

#### Request Body
```json
{
  "title": "Extra Review Session",
  "day": "2026-02-20",
  "start_time": "14:00:00",
  "end_time": "16:00:00",
  "instructor": "uuid-here"  // Optional, defaults to course instructor
}
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Lecture title |
| `day` | Date | Yes | Lecture date (YYYY-MM-DD) |
| `start_time` | Time | Yes | Start time (HH:MM:SS) |
| `end_time` | Time | Yes | End time (HH:MM:SS) |
| `instructor` | UUID | No | Instructor ID (defaults to course instructor) |

#### Validation Rules
- `start_time` must be before `end_time`
- Cannot create duplicate lectures at the same date and time
- Automatically calculates lecture number based on chronological position

#### Response (201 Created)
```json
{
  "id": "new-uuid-here",
  "lecture_number": 12,
  "title": "Extra Review Session",
  "day": "2026-02-20",
  "scheduled_at": "2026-02-20T14:00:00+02:00",
  "start_time": "14:00:00",
  "end_time": "16:00:00",
  "instructor": {
    "id": "uuid-here",
    "full_name": "John Doe"
  },
  "status": "additional",
  "status_display": "Additional",
  "is_accepted": false,
  "attendance_taken": false,
  "created_at": "2026-02-11T10:30:00Z",
  "updated_at": "2026-02-11T10:30:00Z"
}
```

#### Error Responses

**400 Bad Request - Duplicate Lecture**
```json
{
  "day": [
    "محاضرة موجودة بالفعل في 2026-02-20 في الوقت 14:00:00. لا يمكن إنشاء محاضرات مكررة في نفس التاريخ والوقت."
  ],
  "start_time": [
    "محاضرة موجودة بالفعل في هذا الوقت."
  ]
}
```

**400 Bad Request - Invalid Time**
```json
{
  "end_time": [
    "وقت البداية يجب أن يكون قبل وقت النهاية."
  ]
}
```

---

## 2. Check Lecture DateTime Availability

### Endpoint
```
GET /api/courses/<course_id>/lectures/check-datetime/
```

### Authentication
Required: Admin, Supervisor, or Course Instructor

### Description
Checks if a lecture can be created at a specific date and time. Returns detailed information about:
- Whether the datetime is available
- Calculated lecture number
- What will happen (append/insert)
- Which lectures will be affected
- Course end date warnings

**Always returns 200 OK** with a JSON body indicating availability.

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `day` | Date | Yes | Lecture date (YYYY-MM-DD) | `2026-02-15` |
| `start_time` | Time | No | Start time (HH:MM:SS) | `10:00:00` |

### Example Requests
```bash
# Check a specific date and time
GET /api/courses/1/lectures/check-datetime/?day=2026-02-15&start_time=10:00:00

# Check just a date (time defaults to midnight)
GET /api/courses/1/lectures/check-datetime/?day=2026-02-15
```

### Response Scenarios

#### Available - Append at End
```json
{
  "day": "2026-02-20",
  "start_time": "10:00:00",
  "is_available": true,
  "message": "يمكن إنشاء محاضرة في 2026-02-20 في الوقت 10:00:00",
  "calculated_lecture_number": 16,
  "action": "append",
  "action_description": "New lecture will be added at the end as lecture #16.",
  "affected_lectures": "No existing lectures will be renumbered.",
  "total_lectures_after": 16,
  "course_end_date_warning": null
}
```

#### Available - Insert in Middle
```json
{
  "day": "2026-02-18",
  "start_time": "14:00:00",
  "is_available": true,
  "message": "يمكن إنشاء محاضرة في 2026-02-18 في الوقت 14:00:00",
  "calculated_lecture_number": 12,
  "action": "insert",
  "action_description": "New lecture will be inserted as lecture #12. All lectures from #12 onwards will be shifted by +1.",
  "affected_lectures": "5 lecture(s) will be renumbered (lectures #12 to #16 will become #13 to #17).",
  "total_lectures_after": 17,
  "course_end_date_warning": null
}
```

#### Available - With Course End Date Warning
```json
{
  "day": "2026-03-15",
  "start_time": "10:00:00",
  "is_available": true,
  "message": "يمكن إنشاء محاضرة في 2026-03-15 في الوقت 10:00:00",
  "calculated_lecture_number": 20,
  "action": "append",
  "action_description": "New lecture will be added at the end as lecture #20.",
  "affected_lectures": "No existing lectures will be renumbered.",
  "total_lectures_after": 20,
  "course_end_date_warning": "The lecture date (2026-03-15) is after the course end date (2026-03-10). The course end date will be automatically extended."
}
```

#### Not Available - Conflict
```json
{
  "day": "2026-02-15",
  "start_time": "10:00:00",
  "is_available": false,
  "message": "محاضرة موجودة بالفعل في 2026-02-15 في الوقت 10:00:00",
  "action": "conflict",
  "action_description": "Cannot create a lecture at the same date and time as an existing lecture.",
  "existing_lecture": {
    "id": "existing-uuid",
    "lecture_number": 5,
    "title": "Python Basics",
    "status": "scheduled",
    "instructor": "John Doe"
  }
}
```

### Error Responses

**400 Bad Request - Missing Day**
```json
{
  "error": "day query parameter is required",
  "detail": "Please provide a day in the query string (format: YYYY-MM-DD)."
}
```

**400 Bad Request - Invalid Date Format**
```json
{
  "error": "Invalid day format",
  "detail": "day must be in format YYYY-MM-DD (e.g., 2026-02-15)."
}
```

**400 Bad Request - Invalid Time Format**
```json
{
  "error": "Invalid start_time format",
  "detail": "start_time must be in format HH:MM:SS (e.g., 10:00:00)."
}
```

---

## 3. Update Lecture

### Endpoint
```
PUT   /api/lectures/<lecture_id>/edit/
PATCH /api/lectures/<lecture_id>/edit/
```

### Authentication
Required: Admin, Supervisor, or Course Instructor

### Description
Updates lecture information. Supports partial updates (PATCH) or full updates (PUT).

**Restrictions:**
- Cannot modify date/time if attendance has already been taken
- Start time must be before end time

### Request Body (PATCH - Partial Update)
```json
{
  "title": "Updated Lecture Title",
  "status": "completed"
}
```

### Request Body (PUT - Full Update)
```json
{
  "title": "Complete Lecture Title Update",
  "day": "2026-02-16",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "status": "scheduled"
}
```

### Request Fields
| Field | Type | Required (PUT) | Required (PATCH) | Description |
|-------|------|----------------|------------------|-------------|
| `title` | String | No | No | Lecture title |
| `day` | Date | No | No | Lecture date (YYYY-MM-DD) |
| `start_time` | Time | No | No | Start time (HH:MM:SS) |
| `end_time` | Time | No | No | End time (HH:MM:SS) |
| `status` | String | No | No | Status: `scheduled`, `completed`, `cancelled`, `additional` |

### Validation Rules
- `start_time` must be before `end_time`
- Cannot modify `day`, `start_time`, or `end_time` if `attendance_taken` is `true`

### Response (200 OK)
```json
{
  "id": "uuid-here",
  "title": "Updated Lecture Title",
  "course": "Python Programming",
  "course_id": "course-uuid",
  "day": "2026-02-16",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "lecture_number": 5,
  "status": "completed",
  "attendance_taken": false,
  "updated_at": "2026-02-11T11:45:00Z"
}
```

### Error Responses

**400 Bad Request - Invalid Time**
```json
{
  "end_time": [
    "End time must be after start time."
  ]
}
```

**400 Bad Request - Attendance Already Taken**
```json
{
  "non_field_errors": [
    "Cannot modify lecture date/time after attendance has been taken."
  ]
}
```

**403 Forbidden - No Permission**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**
```json
{
  "detail": "Not found."
}
```

---

## Additional Information

### Lecture Status Options
- `scheduled` - Lecture is planned
- `completed` - Lecture has been conducted
- `cancelled` - Lecture was cancelled
- `additional` - Extra lecture added (requires approval)

### Automatic Lecture Numbering
When creating a lecture, the system automatically:
1. Calculates the correct lecture number based on chronological order (date + time)
2. Inserts the lecture at the appropriate position
3. Shifts subsequent lecture numbers if needed
4. Extends course end date if the lecture date exceeds it

### Permissions
- **Admin/Supervisor**: Full access to all lecture operations
- **Instructor**: Can only manage lectures for their assigned courses

### Pagination
Default page size: 10 lectures per page
Maximum page size: 100 lectures per page

Example pagination:
```bash
GET /api/courses/1/lectures/?page=2&page_size=20
```

---

## Complete Examples

### Example 1: Creating an Additional Lecture

**Step 1: Check if datetime is available**
```bash
GET /api/courses/1/lectures/check-datetime/?day=2026-02-20&start_time=14:00:00
```

**Response:**
```json
{
  "is_available": true,
  "calculated_lecture_number": 12,
  "action": "insert",
  "affected_lectures": "5 lecture(s) will be renumbered"
}
```

**Step 2: Create the lecture**
```bash
POST /api/courses/1/lectures/
Content-Type: application/json

{
  "title": "Extra Review Session",
  "day": "2026-02-20",
  "start_time": "14:00:00",
  "end_time": "16:00:00"
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "lecture_number": 12,
  "status": "additional",
  "is_accepted": false
}
```

### Example 2: Filtering Lectures

**Get all scheduled lectures in February that haven't had attendance taken:**
```bash
GET /api/courses/1/lectures/?start_date=2026-02-01&end_date=2026-02-28&status=scheduled&attendance_taken=false
```

### Example 3: Updating a Lecture Status

**Mark a lecture as completed:**
```bash
PATCH /api/lectures/uuid-here/edit/
Content-Type: application/json

{
  "status": "completed"
}
```

---

## Error Handling Summary

| Status Code | Description |
|-------------|-------------|
| 200 | Success (also used for check-datetime) |
| 201 | Lecture created successfully |
| 400 | Validation error or bad request |
| 403 | Permission denied |
| 404 | Lecture or course not found |
| 500 | Server error |

---

*Last Updated: February 11, 2026*
