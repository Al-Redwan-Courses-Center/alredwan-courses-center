# 📖 Courses & Users API

All course, lecture, instructor, and landing page endpoints.

---

## Table of Contents

1. [Courses](#courses)
2. [Lectures](#lectures)
3. [Landing Page](#landing-page)
4. [Instructors](#instructors)

---

## Courses

### List All Courses

| | |
|--|--|
| **URL** | `GET /api/courses/` |
| **Auth** | ✅ Required |

**Query Parameters:**

| Category | Parameter | Type | Example |
|----------|-----------|------|---------|
| **Basic** | `is_active` | boolean | `?is_active=true` |
| | `season` | integer | `?season=1` |
| | `instructor` | integer | `?instructor=5` |
| | `for_adults` | boolean | `?for_adults=true` |
| | `tags` | integer | `?tags=1` |
| **Price** | `price_min` | decimal | `?price_min=300` |
| | `price_max` | decimal | `?price_max=1000` |
| **Dates** | `start_date_after` | date | `?start_date_after=2026-02-01` |
| | `start_date_before` | date | `?start_date_before=2026-12-31` |
| | `end_date_after` | date | `?end_date_after=2026-06-01` |
| | `end_date_before` | date | `?end_date_before=2026-12-31` |
| **Capacity** | `capacity_min` / `capacity_max` | integer | `?capacity_min=20` |
| | `num_lectures_min` / `num_lectures_max` | integer | `?num_lectures_min=30` |
| **Age** | `min_age_max` | integer | `?min_age_max=10` |
| | `max_age_min` | integer | `?max_age_min=12` |
| **Availability** | `has_available_spots` | boolean | `?has_available_spots=true` |
| | `is_full` | boolean | `?is_full=false` |
| **Season** | `season_type` | string | `?season_type=summer_camp` |
| | `season_is_active` | boolean | `?season_is_active=true` |
| **Instructor** | `instructor_type` | string | `?instructor_type=supervisor` |
| **Search** | `search` | string | `?search=quran` |
| **Ordering** | `ordering` | string | `?ordering=-start_date` |

**Ordering options:** `start_date`, `end_date`, `price`, `created_at`, `name`, `capacity`, `num_lectures` (prefix with `-` for descending)

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
    "instructor": { "id": 3, "name": "Ahmed Mohamed" },
    "tags": [{ "id": 1, "name": "Quran" }, { "id": 2, "name": "Beginner" }],
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

### Get Course Detail

| | |
|--|--|
| **URL** | `GET /api/courses/{id}/` or `GET /api/courses/{slug}/` |
| **Auth** | No (Public) |

Returns full course details including `schedules` array:
```json
{
  "schedules": [
    {
      "id": 1,
      "weekday": 0,
      "weekday_display": "Saturday",
      "start_time": "10:00:00",
      "end_time": "12:00:00"
    }
  ]
}
```

---

### Update Course

| | |
|--|--|
| **URL** | `PUT/PATCH /api/courses/{id}/edit/` |
| **Auth** | ✅ Admin |

---

### Get Course Ratings

| | |
|--|--|
| **URL** | `GET /api/courses/{id}/ratings/` |
| **Auth** | ✅ Required |

---

## Lectures

### List Course Lectures

| | |
|--|--|
| **URL** | `GET /api/courses/{course_id}/lectures/` |
| **Auth** | ✅ Required |

Returns only **accepted** lectures (`is_accepted=True`), ordered by `lecture_number`, `day`, and `start_time`.

**Response:**
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
    "instructor": { "id": 3, "full_name": "Ahmed Mohamed" },
    "status": "scheduled",
    "status_display": "مجدولة",
    "is_accepted": true,
    "attendance_taken": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  }
]
```

**Lecture statuses:** `scheduled`, `completed`, `cancelled`, `additional`

---

### Get Lecture Detail

| | |
|--|--|
| **URL** | `GET /api/courses/lectures/{id}/` |
| **Auth** | ✅ Required (Admin, Supervisor, or Instructor) |

Returns detailed information about a specific lecture, including full course details.

**Response:**
```json
{
  "id": 123,
  "lecture_number": 5,
  "title": "Introduction to Tajweed Rules",
  "day": "2026-02-15",
  "scheduled_at": "2026-02-15T10:00:00+02:00",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "duration_minutes": 120,
  "instructor": {
    "id": 3,
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
    "is_full": false
  },
  "status": "scheduled",
  "status_display": "مجدولة",
  "is_accepted": true,
  "attendance_taken": false,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique lecture ID |
| `lecture_number` | integer | Sequential lecture number in course |
| `title` | string | Lecture title |
| `day` | date | Lecture date (`YYYY-MM-DD`) |
| `scheduled_at` | datetime | ISO 8601 datetime with timezone |
| `start_time` | time | Start time (`HH:MM:SS`) |
| `end_time` | time | End time (`HH:MM:SS`) |
| `duration_minutes` | integer | Duration in minutes (nullable) |
| `instructor` | object | Instructor `{id, full_name}` |
| `course` | object | Full course details |
| `status` | string | `scheduled`, `completed`, `cancelled`, `additional` |
| `status_display` | string | Localized status name |
| `is_accepted` | boolean | Whether lecture is approved |
| `attendance_taken` | boolean | Whether attendance was recorded |

---

### Create Additional Lecture

| | |
|--|--|
| **URL** | `POST /api/courses/{course_id}/lectures/` |
| **Auth** | ✅ Admin, Supervisor, or Course Instructor |

Creates an **additional lecture** with `is_accepted=False` (needs approval).

**Request:**
```json
{
  "title": "Extra Review Session",
  "day": "2026-02-12",
  "start_time": "14:00:00",
  "end_time": "16:00:00"
}
```

> 💡 `lecture_number` is **automatically calculated** — no need to send it. The system inserts in chronological order and renumbers subsequent lectures if needed.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Defaults to "Lecture {number}" |
| `day` | date | Yes | `YYYY-MM-DD` |
| `start_time` | time | No | `HH:MM:SS` |
| `end_time` | time | No | Must be after `start_time` |
| `instructor` | integer | No | Defaults to course instructor |

---

### Check Lecture Availability

| | |
|--|--|
| **URL** | `GET /api/courses/{course_id}/lectures/check-datetime/?day={date}&start_time={time}` |
| **Auth** | ✅ Required |

Check if a date/time slot is available before creating a lecture.

**Response (available):**
```json
{
  "day": "2026-02-12",
  "start_time": "14:00:00",
  "is_available": true,
  "calculated_lecture_number": 5,
  "action": "insert",
  "action_description": "New lecture will be inserted as lecture #5. All lectures from #5 onwards will be shifted by +1.",
  "affected_lectures": "3 lecture(s) will be renumbered",
  "total_lectures_after": 8,
  "course_end_date_warning": null
}
```

**Actions:** `conflict` (can't create), `insert` (middle, triggers renumbering), `append` (end)

---

### Update Lecture

| | |
|--|--|
| **URL** | `PUT/PATCH /api/courses/lectures/{id}/edit/` |
| **Auth** | ✅ Admin or Course Instructor |

```json
{
  "title": "Updated Title",
  "day": "2026-02-20",
  "start_time": "14:00:00",
  "end_time": "16:00:00",
  "status": "completed"
}
```

> ⚠️ Cannot change date/time after attendance has been taken.

---

## Landing Page

### Featured Courses

| | |
|--|--|
| **URL** | `GET /api/courses/landingpagecourses/` |
| **Auth** | No (Public) |

Returns active courses marked as featured, ordered by `order` (higher = higher priority).

**Extra filters** (on top of all course filters with `course__` prefix):

| Parameter | Description | Example |
|-----------|-------------|---------|
| `order__gte` | Min display priority | `?order__gte=50` |
| `order__lte` | Max display priority | `?order__lte=100` |

**Ordering:** `-order` (default), `course__start_date`, `course__price`, `course__name`, etc.

---

### Featured Instructors

| | |
|--|--|
| **URL** | `GET /api/users/landingpageinstructors/` |
| **Auth** | No (Public) |

Returns instructors marked as featured, ordered by `order`.

**Extra filters** (with `instructor__` prefix):
- `instructor__type`, `instructor__tags`, `instructor__has_active_courses`, `instructor__min_courses`

---

## Instructors

### List All Instructors

| | |
|--|--|
| **URL** | `GET /api/users/instructors/` |
| **Auth** | ✅ Required |

**Filters:** `type`, `tags`, `joined_date_after/before`, `first_name`, `last_name`, `phone`, `email`, `has_active_courses`, `min_courses`, `search`, `ordering`

---

### Get Instructor Detail

| | |
|--|--|
| **URL** | `GET /api/users/instructors/{id}/` |
| **Auth** | No (Public) |

---

### Get Instructor Ratings

| | |
|--|--|
| **URL** | `GET /api/users/instructors/{id}/ratings/` |
| **Auth** | ✅ Required |

Returns aggregated stats + individual ratings from students and parents:
```json
{
  "instructor_id": 2,
  "instructor_name": "Sheikh Ibrahim Ali",
  "statistics": {
    "average_rating": 8.75,
    "total_ratings": 24,
    "student_ratings_count": 15,
    "student_average": 8.6,
    "parent_ratings_count": 9,
    "parent_average": 9.0
  },
  "ratings": {
    "student_ratings": [...],
    "parent_ratings": [...]
  }
}
```

---

## Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses/` | List courses (with filters) | Required |
| GET | `/api/courses/{id}/` | Course detail (by ID or slug) | Public |
| PUT/PATCH | `/api/courses/{id}/edit/` | Update course | Admin |
| GET | `/api/courses/landingpagecourses/` | Featured courses | Public |
| GET | `/api/courses/{id}/lectures/` | List lectures | Required |
| POST | `/api/courses/{id}/lectures/` | Create additional lecture | Admin/Instructor |
| GET | `/api/courses/{id}/lectures/check-datetime/` | Check availability | Required |
| GET | `/api/courses/lectures/{id}/` | Lecture detail | Required |
| PUT/PATCH | `/api/courses/lectures/{id}/edit/` | Update lecture | Admin/Instructor |
| GET | `/api/courses/lectures/today/` | Today's lectures | Instructor/Admin |
| GET | `/api/courses/{id}/ratings/` | Course ratings | Required |
| GET | `/api/users/instructors/` | List instructors | Required |
| GET | `/api/users/instructors/{id}/` | Instructor detail | Public |
| GET | `/api/users/instructors/{id}/ratings/` | Instructor ratings | Required |
| GET | `/api/users/landingpageinstructors/` | Featured instructors | Public |
| GET | `/api/users/students/` | List students | Admin |
| GET | `/api/users/parents/` | List parents | Admin |

---

## Data Models Reference

### Course Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier |
| `name` | string | Course name |
| `slug` | string | URL-friendly identifier |
| `description` | string | Course description |
| `start_date` | date | `YYYY-MM-DD` |
| `end_date` | date | `YYYY-MM-DD` (nullable) |
| `num_lectures` | integer | Number of lectures |
| `capacity` | integer | Max students |
| `price` | decimal | Course price |
| `is_active` | boolean | Currently active |
| `season` | object | Season details |
| `instructor` | object | Instructor `{id, name}` |
| `tags` | array | Tags `[{id, name}]` |
| `for_adults` | boolean | Adult course flag |
| `min_age` / `max_age` | integer | Age requirements (nullable) |
| `enrolled_count` | integer | Current enrollment |
| `available_spots` | integer | Remaining spots |
| `is_full` | boolean | At capacity |

### Season Types
`summer_camp`, `school`, `ramadan`, `eid`, `mid_year`, `other`

### Weekday Values
| Value | Day |
|-------|-----|
| 0 | Saturday |
| 1 | Sunday |
| 2 | Monday |
| 3 | Tuesday |
| 4 | Wednesday |
| 5 | Thursday |
| 6 | Friday |
