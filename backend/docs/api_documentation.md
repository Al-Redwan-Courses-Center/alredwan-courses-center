# API Documentation - Alredwan Courses Center

## Base URL
```
http://localhost:8000/api
```

---

## Table of Contents
1. [Courses Endpoints](#courses-endpoints)
2. [Users Endpoints](#users-endpoints)
3. [Attendance Endpoints](#attendance-endpoints)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)

---

## Courses Endpoints

### 1. List All Courses
Get a list of all available courses with comprehensive filtering options.

**Endpoint:** `GET /api/courses/`

**Authentication:** Required (IsAuthenticated)

**Query Parameters:**

**Basic Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `is_active` | boolean | Filter by course status | `?is_active=true` |
| `season` | integer | Filter by season ID | `?season=1` |
| `instructor` | integer | Filter by instructor ID | `?instructor=5` |
| `for_adults` | boolean | Filter courses for adults/children | `?for_adults=true` |
| `tags` | integer | Filter by tag ID | `?tags=1` |

**Price Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `price_min` | decimal | Minimum price | `?price_min=300` |
| `price_max` | decimal | Maximum price | `?price_max=1000` |
| `price_min` & `price_max` | decimal | Price range | `?price_min=300&price_max=800` |

**Date Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `start_date_after` | date | Start date on or after | `?start_date_after=2026-02-01` |
| `start_date_before` | date | Start date on or before | `?start_date_before=2026-12-31` |
| `end_date_after` | date | End date on or after | `?end_date_after=2026-06-01` |
| `end_date_before` | date | End date on or before | `?end_date_before=2026-12-31` |

**Capacity & Lectures Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `capacity_min` | integer | Minimum capacity | `?capacity_min=20` |
| `capacity_max` | integer | Maximum capacity | `?capacity_max=50` |
| `num_lectures_min` | integer | Minimum number of lectures | `?num_lectures_min=30` |
| `num_lectures_max` | integer | Maximum number of lectures | `?num_lectures_max=50` |

**Age Range Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `min_age_max` | integer | Courses with min age up to value | `?min_age_max=10` |
| `max_age_min` | integer | Courses with max age from value | `?max_age_min=12` |

**Availability Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `has_available_spots` | boolean | Courses with available spots | `?has_available_spots=true` |
| `is_full` | boolean | Filter full/available courses | `?is_full=false` |

**Season Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `season_type` | string | Filter by season type | `?season_type=summer_camp` |
| `season_is_active` | boolean | Filter by active season | `?season_is_active=true` |

**Instructor Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `instructor_type` | string | Filter by instructor type | `?instructor_type=supervisor` |

**Search & Ordering:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in name, description, instructor name | `?search=quran` |
| `ordering` | string | Order results by field | `?ordering=-start_date` |

**Ordering Options:**
- `start_date` / `-start_date` (ascending/descending)
- `end_date` / `-end_date`
- `price` / `-price`
- `created_at` / `-created_at`
- `name` / `-name`
- `capacity` / `-capacity`
- `num_lectures` / `-num_lectures`

**Example Requests:**
```bash
# Get all active courses
curl -X GET "http://localhost:8000/api/courses/?is_active=true&ordering=-start_date"

# Get affordable courses (price <= 500) starting in February
curl -X GET "http://localhost:8000/api/courses/?price_max=500&start_date_after=2026-02-01"

# Get courses with available spots for children
curl -X GET "http://localhost:8000/api/courses/?has_available_spots=true&for_adults=false"

# Get summer camp courses with at least 30 lectures
curl -X GET "http://localhost:8000/api/courses/?season_type=summer_camp&num_lectures_min=30"

# Search for Tajweed courses taught by supervisors
curl -X GET "http://localhost:8000/api/courses/?search=tajweed&instructor_type=supervisor"

# Get courses suitable for ages 8-12
curl -X GET "http://localhost:8000/api/courses/?min_age_max=8&max_age_min=12"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "Quran Memorization - Beginner",
    "slug": "quran-memorization-beginner",
    "description": "Complete Quran memorization course for beginners",
    "start_date": "2026-02-01",
    "end_date": "2026-06-30",
    "num_lectures": 40,
    "capacity": 20,
    "price": "500.00",
    "is_active": true,
    "season": {
      "id": 1,
      "name": "Winter 2026",
      "season_type": "school",
      "start_date": "2026-01-01",
      "end_date": "2026-06-30",
      "is_active": true
    },
    "instructor": {
      "id": 3,
      "name": "Ahmed Mohamed"
    },
    "tags": [
      {
        "id": 1,
        "name": "Quran"
      },
      {
        "id": 2,
        "name": "Beginner"
      }
    ],
    "for_adults": false,
    "min_age": 8,
    "max_age": 15,
    "enrolled_count": 15,
    "available_spots": 5,
    "is_full": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-20T14:20:00Z"
  }
]
```

---

### 2. Get Course by ID or Slug
Retrieve detailed information about a specific course.

**Endpoint:** `GET /api/courses/{id}/` or `GET /api/courses/{slug}/`

**Authentication:** Not required (Public)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` or `slug` | integer or string | Course ID (numeric) or slug |

**Example Requests:**
```bash
# By ID
curl -X GET "http://localhost:8000/api/courses/1/"

# By Slug
curl -X GET "http://localhost:8000/api/courses/quran-memorization-beginner/"
```

**Example Response:**
```json
{
  "id": 1,
  "name": "Quran Memorization - Beginner",
  "slug": "quran-memorization-beginner",
  "description": "Complete Quran memorization course for beginners with qualified instructors",
  "start_date": "2026-02-01",
  "end_date": "2026-06-30",
  "num_lectures": 40,
  "capacity": 20,
  "price": "500.00",
  "is_active": true,
  "season": {
    "id": 1,
    "name": "Winter 2026",
    "season_type": "school",
    "start_date": "2026-01-01",
    "end_date": "2026-06-30",
    "is_active": true
  },
  "instructor": {
    "id": 3,
    "name": "Ahmed Mohamed"
  },
  "tags": [
    {
      "id": 1,
      "name": "Quran"
    },
    {
      "id": 2,
      "name": "Beginner"
    }
  ],
  "schedules": [
    {
      "id": 1,
      "weekday": 0,
      "weekday_display": "Saturday",
      "start_time": "10:00:00",
      "end_time": "12:00:00"
    },
    {
      "id": 2,
      "weekday": 2,
      "weekday_display": "Monday",
      "start_time": "10:00:00",
      "end_time": "12:00:00"
    }
  ],
  "for_adults": false,
  "min_age": 8,
  "max_age": 15,
  "enrolled_count": 15,
  "available_spots": 5,
  "is_full": false,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-20T14:20:00Z"
}
```

---

### 3. Get Landing Page Featured Courses
Get courses featured on the landing page, ordered by display priority.

**Endpoint:** `GET /api/courses/landingpagecourses/`

**Authentication:** Not required (Public)

**Description:** Returns only active courses that have been marked as featured for display on the landing page. Results are automatically ordered by the `order` field (higher numbers appear first). **This endpoint supports all the same filters as the main courses endpoint** with `course__` prefix.

**Query Parameters:**

**Landing Page Specific:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `order` | integer | Filter by exact display order | `?order=100` |
| `order__gte` | integer | Filter by minimum order value | `?order__gte=50` |
| `order__lte` | integer | Filter by maximum order value | `?order__lte=100` |

**Course Filters (same as main courses endpoint with `course__` prefix):**

**Basic Filters:**
- `course__is_active`, `course__season`, `course__instructor`, `course__for_adults`, `course__tags`

**Price Filters:**
- `course__price_min`, `course__price_max`

**Date Filters:**
- `course__start_date_after`, `course__start_date_before`
- `course__end_date_after`, `course__end_date_before`

**Capacity & Lectures:**
- `course__capacity_min`, `course__capacity_max`
- `course__num_lectures_min`, `course__num_lectures_max`

**Age Range:**
- `course__min_age_max`, `course__max_age_min`

**Season & Instructor:**
- `course__season_type`, `course__season_is_active`
- `course__instructor_type`

**Search & Ordering:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in course name, description, instructor name | `?search=quran` |
| `ordering` | string | Order results by field | `?ordering=-course__start_date` |

**Ordering Options:**
- `order` / `-order` (display priority - default: `-order`)
- `course__start_date` / `-course__start_date`
- `course__end_date` / `-course__end_date`
- `course__price` / `-course__price`
- `course__name` / `-course__name`
- `course__capacity` / `-course__capacity`
- `course__num_lectures` / `-course__num_lectures`
- `created_at` / `-created_at`

**Example Requests:**
```bash
# Get all landing page courses
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/"

# Get high priority (order >= 90) adult courses
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/?order__gte=90&course__for_adults=true"

# Get affordable featured courses (price <= 500) starting in February
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/?course__price_max=500&course__start_date_after=2026-02-01"

# Search for Quran courses with at least 30 lectures
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/?search=quran&course__num_lectures_min=30"

# Get featured summer camp courses taught by supervisors
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/?course__season_type=summer_camp&course__instructor_type=supervisor"

# Get featured courses suitable for ages 8-12 with available spots
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/?course__min_age_max=8&course__max_age_min=12"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "order": 100,
    "created_at": "2026-01-10T08:00:00Z",
    "course": {
      "id": 5,
      "name": "Advanced Tajweed Course",
      "slug": "advanced-tajweed-course",
      "description": "Master the art of Quranic recitation",
      "start_date": "2026-02-15",
      "end_date": "2026-07-15",
      "num_lectures": 30,
      "capacity": 15,
      "price": "750.00",
      "is_active": true,
      "season": {
        "id": 1,
        "name": "Winter 2026",
        "season_type": "school",
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "is_active": true
      },
      "instructor": {
        "id": 2,
        "name": "Sheikh Ibrahim Ali"
      },
      "tags": [
        {
          "id": 1,
          "name": "Quran"
        },
        {
          "id": 3,
          "name": "Advanced"
        }
      ],
      "for_adults": true,
      "min_age": 18,
      "max_age": null,
      "enrolled_count": 12,
      "available_spots": 3,
      "is_full": false,
      "created_at": "2026-01-05T12:00:00Z",
      "updated_at": "2026-01-20T15:30:00Z"
    }
  },
  {
    "id": 2,
    "order": 90,
    "created_at": "2026-01-12T10:30:00Z",
    "course": {
      "id": 3,
      "name": "Islamic Studies for Kids",
      "slug": "islamic-studies-for-kids",
      "description": "Learn Islamic values and teachings in a fun way",
      "start_date": "2026-02-01",
      "end_date": "2026-05-31",
      "num_lectures": 35,
      "capacity": 25,
      "price": "400.00",
      "is_active": true,
      "season": {
        "id": 1,
        "name": "Winter 2026",
        "season_type": "school",
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "is_active": true
      },
      "instructor": {
        "id": 4,
        "name": "Fatima Hassan"
      },
      "tags": [
        {
          "id": 4,
          "name": "Islamic Studies"
        },
        {
          "id": 2,
          "name": "Beginner"
        }
      ],
      "for_adults": false,
      "min_age": 6,
      "max_age": 12,
      "enrolled_count": 20,
      "available_spots": 5,
      "is_full": false,
      "created_at": "2026-01-08T09:15:00Z",
      "updated_at": "2026-01-22T11:45:00Z"
    }
  }
]
```

---

### 4. List Course Lectures
Get all **accepted** lectures for a specific course.

**Endpoint:** `GET /api/courses/{course_id}/lectures/`

**Authentication:** Required (IsAuthenticated)

**Description:** Returns only **accepted lectures** (`is_accepted=True`) for a course, including scheduled, completed, cancelled, and additional lectures. Results are ordered by lecture_number, day, and start_time.

**Important Notes:**
- Only lectures with `is_accepted=True` are returned
- Additional lectures created by instructors need approval before appearing in this list
- Optimized with `select_related` to prevent N+1 query problems

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | string/UUID | Course ID |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/courses/1/lectures/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "lecture_number": 1,
    "title": "Introduction to Quran Memorization",
    "day": "2026-02-08",
    "scheduled_at": "2026-02-08T10:00:00+02:00",
    "start_time": "10:00:00",
    "end_time": "12:00:00",
    "instructor": {
      "id": 3,
      "full_name": "Ahmed Mohamed"
    },
    "status": "scheduled",
    "status_display": "مجدولة",
    "is_accepted": true,
    "attendance_taken": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "lecture_number": 2,
    "title": "Lecture 2",
    "day": "2026-02-10",
    "scheduled_at": "2026-02-10T10:00:00+02:00",
    "start_time": "10:00:00",
    "end_time": "12:00:00",
    "instructor": {
      "id": 3,
      "full_name": "Ahmed Mohamed"
    },
    "status": "additional",
    "status_display": "اضافية",
    "is_accepted": true,
    "attendance_taken": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  }
]
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique lecture identifier |
| `lecture_number` | integer | Lecture number (unique within course) |
| `title` | string | Lecture title |
| `day` | date | Date of lecture (YYYY-MM-DD) |
| `scheduled_at` | datetime | Full datetime when lecture starts (ISO 8601 with timezone) |
| `start_time` | time | Start time (HH:MM:SS) |
| `end_time` | time | End time (HH:MM:SS) |
| `instructor` | object | Instructor details (id and full_name) |
| `status` | string | Status: "scheduled", "completed", "cancelled", or "additional" |
| `status_display` | string | Localized status display (Arabic) |
| `is_accepted` | boolean | Whether lecture is accepted (always true in this endpoint) |
| `attendance_taken` | boolean | Whether attendance has been recorded |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## Attendance Endpoints

### 1. Mark Single Attendance
Mark attendance for a single student or child in a lecture.

**Endpoint:** `POST /api/attendance/lecture/<lecture_id>/mark/`

**Authentication:** Required (Admin or Course Instructor only)

**Permissions:** 
- ✅ **Admins** can mark attendance for any lecture
- ✅ **Course Instructors** can only mark attendance for their own courses
- ❌ Other users cannot access this endpoint

**Description:** Mark attendance for a single student or child using their unique code. The attendance record must already exist in the system before marking.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lecture_id` | integer | Lecture ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | The unique code of the student or child (e.g., 'M64793') |
| `participant_type` | string | Yes | Type of participant: 'student' or 'child' |
| `rating` | integer | Yes | Rating from 1 to 10 |
| `notes` | string | No | Optional notes about the attendance |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/attendance/lecture/123/mark/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "M64793",
    "participant_type": "student",
    "rating": 8,
    "notes": "Good performance today"
  }'
```

**Example Response:**
```json
{
  "message": "Attendance marked successfully",
  "lecture_id": 123,
  "attendance": {
    "id": 456,
    "lecture": 123,
    "lecture_title": "Introduction to Quran Memorization",
    "child": null,
    "student": 15,
    "participant_name": "Ahmed Ali",
    "participant_type": "student",
    "participant_code": "M64793",
    "present": true,
    "rating": 8,
    "notes": "Good performance today",
    "marked_by": 5,
    "marked_by_name": "John Doe",
    "marked_at": "2026-02-10T10:30:00Z",
    "created_at": "2026-02-08T09:00:00Z",
    "updated_at": "2026-02-10T10:30:00Z"
  }
}
```

**Error Responses:**

**403 Forbidden** - Not authorized to mark attendance for this lecture:
```json
{
  "error": "You do not have permission to mark attendance for this lecture."
}
```

**404 Not Found** - Lecture not found:
```json
{
  "error": "Lecture not found."
}
```

**400 Bad Request** - Invalid participant code:
```json
{
  "code": [
    "Student with code 'M99999' not found."
  ]
}
```

**400 Bad Request** - No attendance record:
```json
{
  "non_field_errors": [
    "No attendance record found for this student in this lecture. The attendance record must be created first."
  ]
}
```

**400 Bad Request** - Invalid rating:
```json
{
  "rating": [
    "Ensure this value is less than or equal to 10."
  ]
}
```

---

### 2. Mark Bulk Attendance
Mark attendance for multiple students/children in a lecture at once.

**Endpoint:** `POST /api/attendance/lecture/<lecture_id>/mark-bulk/`

**Authentication:** Required (Admin or Course Instructor only)

**Permissions:** 
- ✅ **Admins** can mark attendance for any lecture
- ✅ **Course Instructors** can only mark attendance for their own courses
- ❌ Other users cannot access this endpoint

**Description:** Mark attendance for multiple students and/or children in a single request. This endpoint is optimized for scenarios where you need to mark attendance for many participants at once (e.g., scanning multiple QR codes, importing from a file, or batch processing). The request includes common metadata (marked_by, marked_via, marked_at) that applies to all attendances, plus individual data for each participant.

**Key Features:**
- ✅ **Transaction-safe**: All or nothing for database integrity
- ✅ **Partial success handling**: Returns both successful and failed records
- ✅ **Detailed summary**: Get complete information about what happened
- ✅ **Flexible marking method**: Support for manual or QR scan
- ✅ **Individual control**: Set rating, notes, and present status for each participant
- ✅ **Permission-based access**: Only admins and course instructors can mark attendance

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lecture_id` | integer | Lecture ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `marked_via` | string | No | Method used: 'manual' or 'qr_scan' (default: 'manual') |
| `attendances` | array | Yes | Array of attendance records (minimum 1) |

**Attendance Item Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | The unique code of the student or child |
| `participant_type` | string | Yes | Type: 'student' or 'child' |
| `rating` | integer | Yes | Rating from 1 to 10 |
| `notes` | string | No | Optional notes (default: empty string) |
| `present` | boolean | No | Whether present (default: true) |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/attendance/lecture/123/mark-bulk/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marked_via": "qr_scan",
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
        "notes": "Excellent participation",
        "present": true
      },
      {
        "code": "M54321",
        "participant_type": "student",
        "rating": 7,
        "notes": "Needs improvement",
        "present": true
      },
      {
        "code": "C67890",
        "participant_type": "child",
        "rating": 10,
        "notes": "Outstanding",
        "present": true
      }
    ]
  }'
```

**Example Response (All Successful):**
```json
{
  "message": "Bulk attendance marking completed",
  "lecture_id": 123,
  "summary": {
    "total_received": 4,
    "successful": 4,
    "failed": 0,
    "marked_by": "John Doe",
    "marked_via": "qr_scan",
    "marked_at": "2026-02-10T10:30:00Z"
  },
  "successful_records": [
    {
      "code": "M64793",
      "participant_type": "student",
      "participant_name": "Ahmed Ali",
      "rating": 8,
      "present": true,
      "attendance_id": 456
    },
    {
      "code": "C12345",
      "participant_type": "child",
      "participant_name": "Fatima",
      "rating": 9,
      "present": true,
      "attendance_id": 457
    },
    {
      "code": "M54321",
      "participant_type": "student",
      "participant_name": "Mohammed Hassan",
      "rating": 7,
      "present": true,
      "attendance_id": 458
    },
    {
      "code": "C67890",
      "participant_type": "child",
      "participant_name": "Sara",
      "rating": 10,
      "present": true,
      "attendance_id": 459
    }
  ],
  "failed_records": []
}
```

**Example Response (Partial Success - HTTP 207 Multi-Status):**
```json
{
  "message": "Bulk attendance marking completed",
  "lecture_id": 123,
  "summary": {
    "total_received": 5,
    "successful": 3,
    "failed": 2,
    "marked_by": "John Doe",
    "marked_via": "manual",
    "marked_at": "2026-02-10T10:30:00Z"
  },
  "successful_records": [
    {
      "code": "M64793",
      "participant_type": "student",
      "participant_name": "Ahmed Ali",
      "rating": 8,
      "present": true,
      "attendance_id": 456
    },
    {
      "code": "C12345",
      "participant_type": "child",
      "participant_name": "Fatima",
      "rating": 9,
      "present": true,
      "attendance_id": 457
    },
    {
      "code": "M54321",
      "participant_type": "student",
      "participant_name": "Mohammed Hassan",
      "rating": 7,
      "present": true,
      "attendance_id": 458
    }
  ],
  "failed_records": [
    {
      "index": 3,
      "code": "M99999",
      "error": "Student with code 'M99999' not found."
    },
    {
      "index": 4,
      "code": "C88888",
      "error": "No attendance record found for this child in this lecture."
    }
  ]
}
```

**Response Status Codes:**
| Status | When |
|--------|------|
| 200 OK | All attendances marked successfully |
| 207 Multi-Status | Some succeeded, some failed |
| 400 Bad Request | All failed or validation error |
| 404 Not Found | Lecture not found |

**Response Fields:**

**Summary Object:**
| Field | Type | Description |
|-------|------|-------------|
| `total_received` | integer | Total number of attendances in the request |
| `successful` | integer | Number of successfully marked attendances |
| `failed` | integer | Number of failed attendances |
| `marked_by` | string | Name of the user who marked the attendance |
| `marked_via` | string | Method used: 'manual' or 'qr_scan' |
| `marked_at` | datetime | When the attendance was marked (ISO 8601) |

**Successful Record Object:**
| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Participant code |
| `participant_type` | string | Type: 'student' or 'child' |
| `participant_name` | string | Full name of the participant |
| `rating` | integer | Rating given (1-10) |
| `present` | boolean | Whether marked as present |
| `attendance_id` | integer | ID of the attendance record |

**Failed Record Object:**
| Field | Type | Description |
|-------|------|-------------|
| `index` | integer | Index in the original request array (optional) |
| `code` | string | Participant code that failed |
| `error` | string | Description of why it failed |

**Error Responses:**

**403 Forbidden** - Not authorized to mark attendance for this lecture:
```json
{
  "error": "You do not have permission to mark attendance for this lecture."
}
```

**404 Not Found** - Lecture not found:
```json
{
  "error": "Lecture with id 999 not found."
}
```

**400 Bad Request** - Empty attendances array:
```json
{
  "attendances": [
    "This list may not be empty."
  ]
}
```

**400 Bad Request** - Invalid marked_via:
```json
{
  "marked_via": [
    "\"invalid\" is not a valid choice."
  ]
}
```

**400 Bad Request** - Missing required fields:
```json
{
  "attendances": [
    {
      "code": [
        "This field is required."
      ],
      "rating": [
        "This field is required."
      ]
    }
  ]
}
```

**400 Bad Request** - Time window restriction (non-admin users):
```json
{
  "non_field_errors": [
    "Attendance can only be marked within the allowed time window (from 24 hours before lecture start until 24 hours after)."
  ]
}
```

**Use Cases:**

1. **QR Code Scanning**: Mark attendance as students scan QR codes at lecture entrance
2. **Batch Import**: Import attendance data from CSV/Excel files
3. **Mobile App**: Mark multiple attendances collected offline and sync later
4. **Manual Entry**: Staff entering attendance for multiple students at once
5. **Make-up Sessions**: Mark attendance for multiple students attending a make-up lecture

**Best Practices:**

1. **Validate before sending**: Check participant codes exist before bulk submission
2. **Handle partial success**: Always check both successful and failed arrays
3. **Retry logic**: Implement retry for failed records with appropriate backoff
4. **Progress feedback**: Show progress UI when processing large batches
5. **Chunk large requests**: Split very large batches (>100) into smaller chunks

**Frontend Integration Example:**
```javascript
async function markBulkAttendance(lectureId, attendances, markedVia = 'manual') {
  const response = await fetch(
    `http://localhost:8000/api/attendance/lecture/${lectureId}/mark-bulk/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marked_via: markedVia,
        attendances: attendances
      })
    }
  );
  
  const result = await response.json();
  
  // Handle results
  if (result.summary.failed > 0) {
    console.warn(`${result.summary.failed} attendances failed:`);
    result.failed_records.forEach(fail => {
      console.error(`- ${fail.code}: ${fail.error}`);
    });
  }
  
  console.log(`Successfully marked ${result.summary.successful} attendances`);
  return result;
}

// Usage
const attendances = [
  { code: 'M64793', participant_type: 'student', rating: 8, notes: 'Great' },
  { code: 'C12345', participant_type: 'child', rating: 9, notes: 'Excellent' }
];

markBulkAttendance(123, attendances, 'qr_scan')
  .then(result => {
    // Update UI with results
    updateAttendanceUI(result);
  })
  .catch(error => {
    console.error('Bulk attendance failed:', error);
  });
}
```

---

## Response Format

### Success Response
All successful API responses follow this general structure:
