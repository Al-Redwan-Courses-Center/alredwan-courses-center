# 📖 Courses & Lectures API Documentation

Comprehensive documentation for all course and lecture management endpoints.

---

## Table of Contents

1. [Course Endpoints](#course-endpoints)
   - [List All Courses](#1-list-all-courses)
   - [Get Course Details](#2-get-course-details)
   - [Update Course](#3-update-course)
   - [Get Course Ratings](#4-get-course-ratings)
   - [Landing Page Courses](#5-landing-page-courses)
2. [Lecture Endpoints](#lecture-endpoints)
   - [List & Create Lectures](#6-list--create-lectures)
   - [Get Lecture Details](#7-get-lecture-details)
   - [Update Lecture](#8-update-lecture)
   - [Check Lecture DateTime Availability](#9-check-lecture-datetime-availability)
   - [Get Today's Lectures](#10-get-todays-lectures)
   - [Get Student Course Lectures](#11-get-student-course-lectures)
   - [Get Parent Course Lectures](#12-get-parent-course-lectures)

---

## Course Endpoints

### 1. List All Courses

Get a list of all available courses with comprehensive filtering options.

| | |
|--|--|
| **URL** | `GET /api/courses/` |
| **Auth** | ✅ Required (IsAuthenticated) |

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
| `num_lectures_min` | integer | Min number of lectures | `?num_lectures_min=30` |
| `num_lectures_max` | integer | Max number of lectures | `?num_lectures_max=50` |

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

**Ordering Options:** `start_date`, `-start_date`, `end_date`, `-end_date`, `price`, `-price`, `created_at`, `-created_at`, `name`, `-name`, `capacity`, `-capacity`, `num_lectures`, `-num_lectures`

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
      { "id": 1, "name": "Quran" },
      { "id": 2, "name": "Beginner" }
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

### 2. Get Course Details

Retrieve detailed information about a specific course by ID or slug.

| | |
|--|--|
| **URL** | `GET /api/courses/{id}/` or `GET /api/courses/{slug}/` |
| **Auth** | ✅ Required (IsAuthenticated) |

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
    { "id": 1, "name": "Quran" },
    { "id": 2, "name": "Beginner" }
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

### 3. Update Course

Update course information. Returns full course details after update.

| | |
|--|--|
| **URL** | `PUT/PATCH /api/courses/{id}/edit/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Course Instructor) |

**Request Body (PATCH - partial update):**

```json
{
  "name": "Updated Course Name",
  "description": "Updated description",
  "price": "600.00",
  "is_active": true
}
```

**Editable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Course name |
| `description` | string | Course description |
| `image` | file | Course image |
| `start_date` | date | Start date (YYYY-MM-DD) |
| `end_date` | date | End date (YYYY-MM-DD) |
| `num_lectures` | integer | Target number of lectures |
| `capacity` | integer | Maximum enrollment capacity |
| `price` | decimal | Course price |
| `is_active` | boolean | Whether course is active |
| `for_adults` | boolean | Whether course is for adults |
| `min_age` | integer | Minimum age requirement |
| `max_age` | integer | Maximum age requirement |

**Validation Rules:**
- `end_date` must be ≥ `start_date`
- `min_age` must be ≤ `max_age`

**Response (200 OK):** Returns full course details (same format as [Get Course Details](#2-get-course-details)).

---

### 4. Get Course Ratings

Retrieve aggregated ratings and individual feedback for a specific course.

| | |
|--|--|
| **URL** | `GET /api/courses/{id}/ratings/` or `GET /api/courses/{slug}/ratings/` |
| **Auth** | ✅ Required (IsAuthenticated) |

**Example Response:**

```json
{
  "course_id": 1,
  "course_name": "Quran Memorization - Beginner",
  "statistics": {
    "average_rating": 8.75,
    "total_ratings": 48,
    "student_ratings_count": 35,
    "student_average": 8.8,
    "parent_ratings_count": 13,
    "parent_average": 8.6
  },
  "ratings": {
    "student_ratings": [
      {
        "id": 101,
        "rating": 9,
        "feedback": "Excellent course content and teaching",
        "created_at": "2026-02-10T14:30:00Z",
        "rater_name": "Ahmed Ali",
        "rater_type": "student"
      }
    ],
    "parent_ratings": [
      {
        "id": 45,
        "rating": 9,
        "feedback": "My child has improved significantly",
        "created_at": "2026-02-08T16:20:00Z",
        "rater_name": "Fatima Khalid",
        "rater_type": "parent"
      }
    ]
  }
}
```

**Statistics Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `average_rating` | float/null | Combined average (1-10), null if no ratings |
| `total_ratings` | integer | Total number of ratings |
| `student_ratings_count` | integer | Ratings from students |
| `student_average` | float/null | Average from students |
| `parent_ratings_count` | integer | Ratings from parents |
| `parent_average` | float/null | Average from parents |

---

### 5. Landing Page Courses

Get courses featured on the landing page, ordered by display priority.

| | |
|--|--|
| **URL** | `GET /api/courses/landingpagecourses/` |
| **Auth** | Not required (Public) |

Returns only active courses marked as featured. Results are ordered by the `order` field (higher numbers appear first). **Supports all the same filters as the main courses endpoint** with `course__` prefix.

**Landing Page Specific Filters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `order` | integer | Filter by exact display order | `?order=100` |
| `order__gte` | integer | Min order value | `?order__gte=50` |
| `order__lte` | integer | Max order value | `?order__lte=100` |

**Course Filters (with `course__` prefix):** `course__is_active`, `course__season`, `course__instructor`, `course__for_adults`, `course__tags`, `course__price_min`, `course__price_max`, `course__start_date_after`, `course__start_date_before`, `course__end_date_after`, `course__end_date_before`, `course__capacity_min`, `course__capacity_max`, `course__num_lectures_min`, `course__num_lectures_max`, `course__min_age_max`, `course__max_age_min`, `course__season_type`, `course__season_is_active`, `course__instructor_type`

**Ordering Options:** `order`, `-order` (default: `-order`), `course__start_date`, `course__price`, `course__name`, `course__capacity`, `course__num_lectures`, `created_at`

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
      "season": { "id": 1, "name": "Winter 2026" },
      "instructor": { "id": 2, "name": "Sheikh Ibrahim Ali" },
      "tags": [{ "id": 1, "name": "Quran" }, { "id": 3, "name": "Advanced" }],
      "for_adults": true,
      "min_age": 18,
      "max_age": null,
      "enrolled_count": 12,
      "available_spots": 3,
      "is_full": false,
      "created_at": "2026-01-05T12:00:00Z",
      "updated_at": "2026-01-20T15:30:00Z"
    }
  }
]
```

---

## Lecture Endpoints

### 6. List & Create Lectures

#### GET: List Course Lectures

Returns all **accepted** lectures for a specific course, ordered by lecture number.

| | |
|--|--|
| **URL** | `GET /api/courses/{course_id}/lectures/` |
| **Auth** | ✅ Required (IsAuthenticated) |

**Query Parameters (Filters):**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `start_date` | date | Lectures on or after this date | `2026-02-01` |
| `end_date` | date | Lectures on or before this date | `2026-02-28` |
| `status` | string | Filter by status | `scheduled`, `completed`, `cancelled`, `additional` |
| `instructor` | integer | Filter by instructor ID | `5` |
| `attendance_taken` | boolean | Filter by attendance status | `true` or `false` |
| `page` | integer | Page number | `1` |
| `page_size` | integer | Results per page (default: 10, max: 100) | `20` |

**Important:** Only lectures with `is_accepted=True` are returned. Additional lectures created by instructors need approval before appearing.

**Example Response:**

```json
{
  "count": 15,
  "next": "http://localhost:8000/api/courses/1/lectures/?page=2",
  "previous": null,
  "results": [
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
    }
  ]
}
```

#### POST: Create Additional Lecture

Creates a new **additional** lecture with `is_accepted=False` (requires approval).

| | |
|--|--|
| **URL** | `POST /api/courses/{course_id}/lectures/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Course Instructor) |

**Request Body:**

```json
{
  "title": "Extra Review Session",
  "day": "2026-02-20",
  "start_time": "14:00:00",
  "end_time": "16:00:00",
  "instructor": "uuid-here"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | date | **Yes** | Lecture date (YYYY-MM-DD) — only required field |
| `title` | string | No | Auto-generated if omitted ("Lecture #N") |
| `start_time` | time | No | Start time (HH:MM:SS) |
| `end_time` | time | No | End time (HH:MM:SS) |
| `instructor` | UUID | No | Defaults to course instructor |

**Validation Rules:**
- `start_time` must be before `end_time` (if both provided)
- Cannot create duplicate lectures at the same date and time
- Lecture number is automatically calculated based on chronological position
- **Non-admin users** (instructors, supervisors) cannot create lectures in the past
- **Admin users** can create lectures on any date (for backfilling, historical data import, etc.)

**Error (400 Bad Request) - Past Date for Non-Admin:**
```json
{
  "day": ["لا يمكن إنشاء محاضرة في الماضي. يرجى اختيار تاريخ اليوم أو تاريخ مستقبلي."]
}
```

**Response (201 Created):**

```json
{
  "id": "new-uuid-here",
  "lecture_number": 12,
  "title": "Extra Review Session",
  "day": "2026-02-20",
  "scheduled_at": "2026-02-20T14:00:00+02:00",
  "start_time": "14:00:00",
  "end_time": "16:00:00",
  "instructor": { "id": "uuid-here", "full_name": "John Doe" },
  "status": "additional",
  "status_display": "Additional",
  "is_accepted": false,
  "attendance_taken": false,
  "created_at": "2026-02-11T10:30:00Z",
  "updated_at": "2026-02-11T10:30:00Z"
}
```

---

### 7. Get Lecture Details

Retrieve detailed lecture information including full course details.

| | |
|--|--|
| **URL** | `GET /api/courses/lectures/{id}/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Course Instructor) |

**Example Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "lecture_number": 5,
  "title": "Introduction to Tajweed",
  "day": "2026-02-16",
  "scheduled_at": "2026-02-16T10:00:00+02:00",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "duration_minutes": 120,
  "instructor": {
    "id": "instructor-uuid",
    "full_name": "Ahmed Mohamed"
  },
  "course": {
    "id": 1,
    "name": "Quran Memorization - Beginner",
    "slug": "quran-memorization-beginner",
    "description": "Complete Quran memorization course",
    "start_date": "2026-02-01",
    "end_date": "2026-06-30",
    "num_lectures": 40,
    "capacity": 20,
    "price": "500.00",
    "is_active": true,
    "season": { "id": 1, "name": "Winter 2026" },
    "instructor": { "id": 3, "name": "Ahmed Mohamed" },
    "tags": [{ "id": 1, "name": "Quran" }],
    "for_adults": false,
    "min_age": 8,
    "max_age": 15,
    "enrolled_count": 15,
    "available_spots": 5,
    "is_full": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-20T14:20:00Z"
  },
  "status": "scheduled",
  "status_display": "مجدولة",
  "is_accepted": true,
  "attendance_taken": false,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique lecture identifier |
| `lecture_number` | integer | Sequential lecture number |
| `title` | string | Lecture title |
| `day` | date | Lecture date (YYYY-MM-DD) |
| `scheduled_at` | datetime | ISO 8601 datetime with timezone |
| `start_time` | time | Start time (HH:MM:SS) |
| `end_time` | time | End time (HH:MM:SS) |
| `duration_minutes` | integer/null | Duration in minutes (null if times not set) |
| `instructor` | object | Instructor details (id, full_name) |
| `course` | object | Full course details |
| `status` | string | `scheduled`, `completed`, `cancelled`, or `additional` |
| `status_display` | string | Localized status display |
| `is_accepted` | boolean | Whether lecture is approved |
| `attendance_taken` | boolean | Whether attendance has been recorded |

---

### 8. Update Lecture

Update lecture information.

| | |
|--|--|
| **URL** | `PUT/PATCH /api/courses/lectures/{id}/edit/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Course Instructor) |

**Request Body (PATCH):**

```json
{
  "title": "Updated Lecture Title",
  "status": "completed"
}
```

**Editable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Lecture title |
| `day` | date | Lecture date (YYYY-MM-DD) |
| `start_time` | time | Start time (HH:MM:SS) |
| `end_time` | time | End time (HH:MM:SS) |
| `status` | string | `scheduled`, `completed`, `cancelled`, `additional` |

**Restrictions:**
- `start_time` must be before `end_time`
- Cannot modify `day`, `start_time`, or `end_time` if `attendance_taken` is `true`

**Response (200 OK):**

```json
{
  "id": "uuid-here",
  "title": "Updated Lecture Title",
  "course": "Quran Memorization",
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

---

### 9. Check Lecture DateTime Availability

Check if a lecture can be created at a specific date and time. **Always returns 200 OK** with a JSON body indicating availability.

| | |
|--|--|
| **URL** | `GET /api/courses/{course_id}/lectures/check-datetime/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Course Instructor) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `day` | date | **Yes** | Lecture date (YYYY-MM-DD) |
| `start_time` | time | No | Start time (HH:MM:SS) |

**Response — Available (Append):**

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

**Response — Available (Insert in Middle):**

```json
{
  "day": "2026-02-18",
  "start_time": "14:00:00",
  "is_available": true,
  "calculated_lecture_number": 12,
  "action": "insert",
  "action_description": "New lecture will be inserted as lecture #12. All lectures from #12 onwards will be shifted by +1.",
  "affected_lectures": "5 lecture(s) will be renumbered (lectures #12 to #16 will become #13 to #17).",
  "total_lectures_after": 17,
  "course_end_date_warning": null
}
```

**Response — Not Available (Conflict):**

```json
{
  "day": "2026-02-15",
  "start_time": "10:00:00",
  "is_available": false,
  "message": "محاضرة موجودة بالفعل في 2026-02-15 في الوقت 10:00:00",
  "action": "conflict",
  "existing_lecture": {
    "id": "existing-uuid",
    "lecture_number": 5,
    "title": "Lecture Title",
    "status": "scheduled",
    "instructor": "John Doe"
  }
}
```

---

### 10. Get Today's Lectures

Returns all lectures scheduled for today (both accepted and pending approval).

| | |
|--|--|
| **URL** | `GET /api/courses/lectures/today/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Instructor) |

**Role-Based Behavior:**
- **Regular Instructors**: Returns only their own lectures
- **Admins/Supervisors**: Returns all lectures for all instructors

**Example Response:**

```json
{
  "date": "2026-02-16",
  "count": 3,
  "user_role": "instructor",
  "lectures": [
    {
      "id": "uuid-1",
      "lecture_number": 5,
      "title": "Introduction to Quran",
      "day": "2026-02-16",
      "scheduled_at": "2026-02-16T09:00:00+02:00",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "instructor": {
        "id": "instructor-uuid",
        "full_name": "John Doe"
      },
      "course": {
        "id": "course-uuid-1",
        "name": "Quran Memorization"
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `date` | date | Today's date (YYYY-MM-DD) |
| `count` | integer | Total lectures returned |
| `user_role` | string | `"instructor"` or `"admin/supervisor"` |
| `lectures` | array | Lecture objects (ordered by start_time, then lecture_number) |

**Notes:**
- Returns **all** lectures for today, including those with `is_accepted=False`
- Differs from course-specific lecture list which only returns accepted lectures
- No pagination (daily count is manageable)
- No lectures → `{ "date": "...", "count": 0, "lectures": [] }`

---

## Lecture Status Options

| Status | Arabic | Description |
|--------|--------|-------------|
| `scheduled` | مجدولة | Lecture is planned |
| `completed` | مكتملة | Lecture has been conducted |
| `cancelled` | ملغاة | Lecture was cancelled |
| `additional` | اضافية | Extra lecture added (requires approval) |

---

### 11. Get Student Course Lectures

Get all lectures for a specific course for the logged-in student, including their personal attendance records.

| | |
|--|--|
| **URL** | `GET /api/courses/{course_id}/student/lectures/` |
| **Auth** | ✅ Required (IsAuthenticated) |
| **Permissions** | Logged-in user must be a Student enrolled in the course. |

**Success Response:**
```json
[
  {
    "id": 1,
    "lecture_number": 1,
    "title": "Introduction",
    "day": "2026-02-18",
    "status": "completed",
    "status_display": "Completed",
    "attendance_info": {
      "present": true,
      "rating": 9,
      "notes": "Excellent participation",
      "marked_at": "2026-02-18T10:30:00Z"
    }
  }
]
```

---

### 12. Get Parent Course Lectures

Get all lectures for a specific course for a specific child of the logged-in parent, including the child's attendance records.

| | |
|--|--|
| **URL** | `GET /api/courses/{course_id}/parent/{child_id}/lectures/` |
| **Auth** | ✅ Required (IsAuthenticated) |
| **Permissions** | Logged-in user must be a Parent, the child must belong to them, and the child must be enrolled in the course. |

**Success Response:**
Same format as the student endpoint.

---

## Quick Reference Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses/` | List courses | Auth |
| GET | `/api/courses/{id_or_slug}/` | Course details | Public |
| PUT/PATCH | `/api/courses/{id}/edit/` | Update course | Admin/Sup/Instructor |
| GET | `/api/courses/{id_or_slug}/ratings/` | Course ratings | Auth |
| GET | `/api/courses/landingpagecourses/` | Featured courses | Public |
| GET/POST | `/api/courses/{course_id}/lectures/` | List/create lectures | Auth / Admin+ |
| GET | `/api/courses/{course_id}/lectures/check-datetime/` | Check availability | Admin/Sup/Instructor |
| GET | `/api/courses/lectures/{id}/` | Lecture details | Admin/Sup/Instructor |
| PUT/PATCH | `/api/courses/lectures/{id}/edit/` | Update lecture | Admin/Sup/Instructor |
| GET | `/api/courses/lectures/today/` | Today's lectures | Admin/Sup/Instructor |
