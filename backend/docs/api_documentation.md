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
Get a list of all available courses.

**Endpoint:** `GET /api/courses/`

**Authentication:** Not required (Public)

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `is_active` | boolean | Filter by course status | `?is_active=true` |
| `season` | integer | Filter by season ID | `?season=1` |
| `instructor` | integer | Filter by instructor ID | `?instructor=5` |
| `for_adults` | boolean | Filter courses for adults/children | `?for_adults=true` |
| `search` | string | Search in course name and description | `?search=quran` |
| `ordering` | string | Order results by field | `?ordering=-start_date` |

**Ordering Options:**
- `start_date` / `-start_date` (ascending/descending)
- `price` / `-price`
- `created_at` / `-created_at`
- `name` / `-name`

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/courses/?is_active=true&ordering=-start_date"
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

**Description:** Returns only active courses that have been marked as featured for display on the landing page. Results are automatically ordered by the `order` field (higher numbers appear first).

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/courses/landingpagecourses/"
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

**Endpoint:** `GET /api/users/instructors/landing/`

**Authentication:** Not required (Public)

**Description:** Returns instructors that have been marked as featured for display on the landing page. Results are automatically ordered by the `order` field (higher numbers appear first).

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/"
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
Get a list of all instructors.

**Endpoint:** `GET /api/users/instructors/`

**Authentication:** Not required (Public)

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | string | Filter by instructor type (supervisor/normal) | `?type=supervisor` |
| `search` | string | Search in instructor name and bio | `?search=ahmed` |
| `ordering` | string | Order results by field | `?ordering=-joined_date` |

**Ordering Options:**
- `joined_date` / `-joined_date` (ascending/descending)
- `user__first_name` / `-user__first_name`
- `user__last_name` / `-user__last_name`

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/instructors/?type=supervisor&ordering=-joined_date"
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
