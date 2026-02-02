# API Documentation - Alredwan Courses Center

## Base URL
```
http://localhost:8000/api
```

---

## Table of Contents
1. [Courses Endpoints](#courses-endpoints)
2. [Users Endpoints](#users-endpoints)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)

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

## Users Endpoints

### 4. Get Landing Page Featured Instructors
Get instructors featured on the landing page, ordered by display priority.

**Endpoint:** `GET /api/users/landingpageinstructors/`

**Authentication:** Not required (Public)

**Description:** Returns instructors that have been marked as featured for display on the landing page. Results are automatically ordered by the `order` field (higher numbers appear first). **This endpoint supports all the same filters as the main instructors endpoint** with `instructor__` prefix.

**Query Parameters:**

**Landing Page Specific:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `order` | integer | Filter by exact display order | `?order=100` |
| `order__gte` | integer | Filter by minimum order value | `?order__gte=50` |
| `order__lte` | integer | Filter by maximum order value | `?order__lte=100` |

**Instructor Filters (same as main instructors endpoint with `instructor__` prefix):**

**Basic Filters:**
- `instructor__type`, `instructor__tags`

**Date Filters:**
- `instructor__joined_date_after`, `instructor__joined_date_before`

**Name Filters:**
- `instructor__first_name`, `instructor__last_name`

**Contact Filters:**
- `instructor__phone`, `instructor__email`

**Course-Related Filters:**
- `instructor__has_active_courses`, `instructor__min_courses`

**Search & Ordering:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in name, bio, email, phone | `?search=ibrahim` |
| `ordering` | string | Order results by field | `?ordering=-instructor__joined_date` |

**Ordering Options:**
- `order` / `-order` (display priority - default: `-order`)
- `instructor__joined_date` / `-instructor__joined_date`
- `instructor__type` / `-instructor__type`
- `created_at` / `-created_at`

**Example Requests:**
```bash
# Get all landing page instructors
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/"

# Get high priority (order >= 90) supervisor instructors
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/?order__gte=90&instructor__type=supervisor"

# Get featured instructors who joined in 2024 with active courses
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/?instructor__joined_date_after=2024-01-01&instructor__has_active_courses=true"

# Search for instructors teaching Tajweed
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/?search=tajweed"

# Get featured instructors with at least 3 active courses
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/?instructor__min_courses=3"

# Filter by email domain and type
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/?instructor__email=alredwan.com&instructor__type=supervisor"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "order": 100,
    "created_at": "2026-01-05T14:20:00Z",
    "instructor": {
      "id": 2,
      "name": "Sheikh Ibrahim Ali",
      "email": "ibrahim.ali@alredwan.com",
      "phone": "+201234567890",
      "bio": "Sheikh Ibrahim has over 15 years of experience teaching Quran and Tajweed. He holds an Ijazah in Quranic recitation and has memorized the entire Quran. He specializes in teaching advanced Tajweed rules and helping students perfect their recitation.",
      "type": "normal",
      "type_display": "عادي / خارجي",
      "image_url": "http://localhost:8000/media/instructors/2/profile.jpg",
      "joined_date": "2024-09-01"
    }
  },
  {
    "id": 2,
    "order": 95,
    "created_at": "2026-01-08T09:00:00Z",
    "instructor": {
      "id": 4,
      "name": "Fatima Hassan",
      "email": "fatima.hassan@alredwan.com",
      "phone": "+201234567891",
      "bio": "Sister Fatima is passionate about teaching Islamic studies to children. She has a degree in Islamic Education and has been teaching for 8 years. She creates engaging and fun learning experiences for young students.",
      "type": "supervisor",
      "type_display": "مشرف",
      "image_url": "http://localhost:8000/media/instructors/4/profile.jpg",
      "joined_date": "2023-02-15"
    }
  },
  {
    "id": 3,
    "order": 85,
    "created_at": "2026-01-10T11:30:00Z",
    "instructor": {
      "id": 3,
      "name": "Ahmed Mohamed",
      "email": "ahmed.mohamed@alredwan.com",
      "phone": "+201234567892",
      "bio": "Ustadh Ahmed specializes in teaching Quran memorization to beginners. He uses effective memorization techniques and provides personalized guidance to each student. He has helped hundreds of students memorize the Quran.",
      "type": "normal",
      "type_display": "عادي / خارجي",
      "image_url": null,
      "joined_date": "2025-06-10"
    }
  }
]
```

---

### 5. List All Instructors
Get a list of all instructors with comprehensive filtering options.

**Endpoint:** `GET /api/users/instructors/`

**Authentication:** Required (IsAuthenticated)

**Query Parameters:**

**Basic Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | string | Filter by instructor type (supervisor/normal) | `?type=supervisor` |
| `tags` | integer | Filter by tag ID | `?tags=1` |

**Date Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `joined_date_after` | date | Joined on or after | `?joined_date_after=2024-01-01` |
| `joined_date_before` | date | Joined on or before | `?joined_date_before=2026-01-31` |

**Name Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `first_name` | string | Filter by first name (contains) | `?first_name=ahmed` |
| `last_name` | string | Filter by last name (contains) | `?last_name=hassan` |

**Contact Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `phone` | string | Filter by phone number (contains) | `?phone=0123` |
| `email` | string | Filter by email (contains) | `?email=gmail.com` |

**Course-Related Filters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `has_active_courses` | boolean | Filter instructors with active courses | `?has_active_courses=true` |
| `min_courses` | integer | Minimum number of active courses | `?min_courses=2` |

**Search & Ordering:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in name, bio, email, phone | `?search=sheikh` |
| `ordering` | string | Order results by field | `?ordering=-joined_date` |

**Ordering Options:**
- `joined_date` / `-joined_date` (ascending/descending)
- `user__first_name` / `-user__first_name`
- `user__last_name` / `-user__last_name`
- `type` / `-type`

**Example Requests:**
```bash
# Get all supervisor instructors
curl -X GET "http://localhost:8000/api/users/instructors/?type=supervisor&ordering=-joined_date"

# Get instructors who joined in 2024 and have active courses
curl -X GET "http://localhost:8000/api/users/instructors/?joined_date_after=2024-01-01&has_active_courses=true"

# Get instructors with at least 3 active courses
curl -X GET "http://localhost:8000/api/users/instructors/?min_courses=3"

# Search for instructors by name or bio
curl -X GET "http://localhost:8000/api/users/instructors/?search=tajweed"

# Get instructors teaching Quran (tag filter)
curl -X GET "http://localhost:8000/api/users/instructors/?tags=1"

# Filter by email domain
curl -X GET "http://localhost:8000/api/users/instructors/?email=alredwan.com"
```

**Example Response:**
```json
[
  {
    "id": 2,
    "name": "Sheikh Ibrahim Ali",
    "bio": "Sheikh Ibrahim has over 15 years of experience teaching Quran and Tajweed. He holds an Ijazah in Quranic recitation and has memorized the entire Quran. He specializes in teaching advanced Tajweed rules and helping students perfect their recitation.",
    "type": "normal",
    "type_display": "عادي / خارجي",
    "image_url": "http://localhost:8000/media/instructors/2/profile.jpg",
    "joined_date": "2024-09-01",
    "tags": [
      {
        "id": 1,
        "name": "Quran"
      },
      {
        "id": 3,
        "name": "Tajweed"
      }
    ]
  },
  {
    "id": 4,
    "name": "Fatima Hassan",
    "bio": "Sister Fatima is passionate about teaching Islamic studies to children. She has a degree in Islamic Education and has been teaching for 8 years. She creates engaging and fun learning experiences for young students.",
    "type": "supervisor",
    "type_display": "مشرف",
    "image_url": "http://localhost:8000/media/instructors/4/profile.jpg",
    "joined_date": "2023-02-15",
    "tags": [
      {
        "id": 4,
        "name": "Islamic Studies"
      }
    ]
  }
]
```

---

### 6. Get Instructor by ID
Retrieve detailed information about a specific instructor.

**Endpoint:** `GET /api/users/instructors/{id}/`

**Authentication:** Not required (Public)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Instructor ID |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/instructor/2/"
```

**Example Response:**
```json
{
  "id": 2,
  "name": "Sheikh Ibrahim Ali",
  "email": "ibrahim.ali@alredwan.com",
  "phone": "+201234567890",
  "bio": "Sheikh Ibrahim has over 15 years of experience teaching Quran and Tajweed. He holds an Ijazah in Quranic recitation and has memorized the entire Quran. He specializes in teaching advanced Tajweed rules and helping students perfect their recitation.",
  "type": "normal",
  "type_display": "عادي / خارجي",
  "image_url": "http://localhost:8000/media/instructors/2/profile.jpg",
  "joined_date": "2024-09-01",
  "tags": [
    {
      "id": 1,
      "name": "Quran"
    },
    {
      "id": 3,
      "name": "Tajweed"
    }
  ]
}
```

---

## Response Format

### Success Response
All successful API responses follow this general structure:

**Status Code:** `200 OK`

**For List Endpoints:**
```json
[
  {
    // Object 1
  },
  {
    // Object 2
  }
]
```

**For Detail Endpoints:**
```json
{
  // Single object with all details
}
```

### Pagination
Currently, list endpoints return all results without pagination. If you need pagination, you can implement it using DRF's pagination classes.

---

## Error Handling

### Common Error Responses

#### 404 Not Found
When a requested resource doesn't exist.

```json
{
  "detail": "Not found."
}
```

**Example:** Requesting a course that doesn't exist
```bash
GET /api/courses/999/
```

#### 400 Bad Request
When request parameters are invalid.

```json
{
  "detail": "Invalid parameter value"
}
```

**Example:** Invalid filter value
```bash
GET /api/courses/?is_active=invalid_value
```

#### 500 Internal Server Error
When there's a server-side error.

```json
{
  "detail": "Internal server error"
}
```

---

## Data Models Reference

### Course Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique course identifier |
| `name` | string | Course name |
| `slug` | string | URL-friendly course identifier |
| `description` | string | Detailed course description |
| `start_date` | date | Course start date (YYYY-MM-DD) |
| `end_date` | date | Course end date (nullable) |
| `num_lectures` | integer | Number of lectures |
| `capacity` | integer | Maximum number of students |
| `price` | decimal | Course price |
| `is_active` | boolean | Whether course is currently active |
| `season` | object | Associated season details |
| `instructor` | object | Instructor details |
| `tags` | array | List of course tags/categories |
| `schedules` | array | Course schedule (detail view only) |
| `for_adults` | boolean | Whether course is for adults |
| `min_age` | integer | Minimum age requirement (nullable) |
| `max_age` | integer | Maximum age requirement (nullable) |
| `enrolled_count` | integer | Current number of enrolled students |
| `available_spots` | integer | Number of available spots |
| `is_full` | boolean | Whether course is at capacity |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

### Season Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique season identifier |
| `name` | string | Season name |
| `season_type` | string | Type: summer_camp, school, ramadan, eid, mid_year, other |
| `start_date` | date | Season start date |
| `end_date` | date | Season end date (nullable) |
| `is_active` | boolean | Whether season is currently active |

### Instructor Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique instructor identifier |
| `name` | string | Full name |
| `email` | string | Email address (landing page only) |
| `phone` | string | Phone number (landing page only) |
| `bio` | string | Biography/description (landing page only) |
| `type` | string | Type: supervisor or normal |
| `type_display` | string | Localized type display (landing page only) |
| `image_url` | string | Profile image URL (landing page only) |
| `joined_date` | date | Join date (landing page only) |

### Tag Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique tag identifier |
| `name` | string | Tag name |

### Course Schedule Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique schedule identifier |
| `weekday` | integer | Day of week (0=Saturday, 6=Friday) |
| `weekday_display` | string | Day name in English |
| `start_time` | time | Start time (HH:MM:SS) |
| `end_time` | time | End time (HH:MM:SS) |

---

## Use Cases & Examples

### Example 1: Display All Active Courses on Homepage
```bash
curl -X GET "http://localhost:8000/api/courses/?is_active=true&ordering=-start_date"
```

### Example 2: Search for Quran Courses
```bash
curl -X GET "http://localhost:8000/api/courses/?search=quran"
```

### Example 3: Get Courses for Children Only
```bash
curl -X GET "http://localhost:8000/api/courses/?for_adults=false"
```

### Example 4: Get Courses by Specific Instructor
```bash
curl -X GET "http://localhost:8000/api/courses/?instructor=3"
```

### Example 5: Get Featured Content for Landing Page
```bash
# Get featured courses
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/"

# Get featured instructors
curl -X GET "http://localhost:8000/api/users/instructors/landing/"
```

### Example 6: Get Full Course Details with Schedules
```bash
curl -X GET "http://localhost:8000/api/courses/1/"
```

---

## Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)
```javascript
// Get all active courses
async function getCourses() {
  const response = await fetch('http://localhost:8000/api/courses/?is_active=true');
  const courses = await response.json();
  return courses;
}

// Get course by ID
async function getCourseById(id) {
  const response = await fetch(`http://localhost:8000/api/courses/${id}/`);
  const course = await response.json();
  return course;
}

// Get landing page featured courses
async function getLandingPageCourses() {
  const response = await fetch('http://localhost:8000/api/courses/landingpagecourses/');
  const featuredCourses = await response.json();
  return featuredCourses;
}

// Get landing page featured instructors
async function getLandingPageInstructors() {
  const response = await fetch('http://localhost:8000/api/users/instructors/landing/');
  const featuredInstructors = await response.json();
  return featuredInstructors;
}
```

### React Example
```jsx
import { useEffect, useState } from 'react';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/courses/?is_active=true')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching courses:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Available Courses</h1>
      {courses.map(course => (
        <div key={course.id}>
          <h2>{course.name}</h2>
          <p>{course.description}</p>
          <p>Price: ${course.price}</p>
          <p>Available Spots: {course.available_spots}</p>
          <p>Instructor: {course.instructor.name}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Notes

1. **All endpoints are currently public** (no authentication required). Consider adding authentication if needed for certain endpoints.

2. **CORS Configuration**: Make sure to configure CORS in Django settings if your frontend is on a different domain.

3. **Image URLs**: Instructor profile images return absolute URLs when available. If no image is uploaded, the `image_url` field will be `null`.

4. **Date Format**: All dates are returned in ISO 8601 format (YYYY-MM-DD).

5. **Datetime Format**: All timestamps are returned in ISO 8601 format with timezone (YYYY-MM-DDTHH:MM:SSZ).

6. **Filtering Performance**: The endpoints use optimized queries with `select_related` and `prefetch_related` to minimize database hits.

7. **Landing Page Order**: The `order` field in landing page endpoints determines display priority (higher numbers = higher priority).

---

## Changelog

### Version 1.0 (January 25, 2026)
- Initial API release
- Added courses listing and detail endpoints
- Added landing page featured courses endpoint
- Added landing page featured instructors endpoint
- Implemented filtering, searching, and ordering capabilities

---

## Support

For questions or issues, please contact the development team or refer to the project's issue tracker.
