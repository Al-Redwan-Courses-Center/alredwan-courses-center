# 👤 Users & Instructors API Documentation

Documentation for instructor listing, details, ratings, and landing page endpoints.

---

## Table of Contents

1. [List All Instructors](#1-list-all-instructors)
2. [Get Instructor Details](#2-get-instructor-details)
3. [Get Instructor Ratings](#3-get-instructor-ratings)
4. [Landing Page Featured Instructors](#4-landing-page-featured-instructors)

---

### 1. List All Instructors

Get a paginated list of all instructors with filtering, searching, and ordering.

| | |
|--|--|
| **URL** | `GET /api/users/instructors/` |
| **Auth** | ✅ Required (IsAuthenticated) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 10, max: 100) |
| `type` | string | Filter by type: `supervisor` or `normal` |
| `tags` | integer | Filter by tag ID |
| `joined_date__gte` | date | Joined date on or after |
| `joined_date__lte` | date | Joined date on or before |
| `user__first_name__icontains` | string | Filter by first name (case-insensitive) |
| `user__last_name__icontains` | string | Filter by last name (case-insensitive) |
| `user__phone_number1__icontains` | string | Filter by phone number |
| `user__email__icontains` | string | Filter by email |
| `search` | string | Search in first name, last name, bio, email, phone |
| `ordering` | string | Order by: `joined_date`, `user__first_name`, `user__last_name`, `type` (prefix `-` for desc) |

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/users/instructors/?type=supervisor&ordering=-joined_date" \
  -H "Authorization: JWT YOUR_TOKEN"
```

**Example Response:**

```json
{
  "count": 25,
  "next": "http://localhost:8000/api/users/instructors/?page=2&page_size=10",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Dr. Ahmed Hassan",
      "bio": "Specialist in Quran memorization with 15 years of experience",
      "type": "supervisor",
      "type_display": "Supervisor",
      "image_url": "http://localhost:8000/media/instructors/ahmed_hassan.jpg",
      "joined_date": "2024-01-15",
      "tags": [
        { "id": 1, "name": "Quran Memorization", "slug": "quran-memorization" },
        { "id": 2, "name": "Tajweed", "slug": "tajweed" }
      ]
    }
  ]
}
```

---

### 2. Get Instructor Details

Retrieve detailed information about a specific instructor.

| | |
|--|--|
| **URL** | `GET /api/users/instructors/{id}/` |
| **Auth** | Not required (Public) |

**Example Response:**

```json
{
  "id": 1,
  "name": "Dr. Ahmed Hassan",
  "email": "ahmed.hassan@example.com",
  "phone": "+201234567890",
  "bio": "Specialist in Quran memorization with 15 years of experience.",
  "type": "supervisor",
  "type_display": "Supervisor",
  "image_url": "http://localhost:8000/media/instructors/ahmed_hassan.jpg",
  "joined_date": "2024-01-15",
  "tags": [
    { "id": 1, "name": "Quran Memorization", "slug": "quran-memorization" },
    { "id": 2, "name": "Tajweed", "slug": "tajweed" }
  ]
}
```

---

### 3. Get Instructor Ratings

Retrieve aggregated ratings and individual feedback for an instructor.

| | |
|--|--|
| **URL** | `GET /api/users/instructors/{id}/ratings/` |
| **Auth** | ✅ Required (IsAuthenticated) |

**Example Response:**

```json
{
  "instructor_id": 1,
  "instructor_name": "Dr. Ahmed Hassan",
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
        "feedback": "Excellent teacher with great patience and knowledge",
        "created_at": "2026-02-10T14:30:00Z",
        "course_name": "Quran Memorization - Level 1",
        "rater_name": "Ahmed Ali",
        "rater_type": "student"
      }
    ],
    "parent_ratings": [
      {
        "id": 45,
        "rating": 9,
        "feedback": "My child has improved significantly under his guidance",
        "created_at": "2026-02-08T16:20:00Z",
        "course_name": "Quran Memorization - Level 1",
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
| `average_rating` | float | Combined average rating (1-10) |
| `total_ratings` | integer | Total number of ratings |
| `student_ratings_count` | integer | Ratings from students |
| `student_average` | float | Average from students |
| `parent_ratings_count` | integer | Ratings from parents |
| `parent_average` | float | Average from parents |

**Rating Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Rating record ID |
| `rating` | integer | Rating value (1-10) |
| `feedback` | string/null | Optional feedback text |
| `created_at` | datetime | When the rating was created (ISO 8601) |
| `course_name` | string | Associated course name |
| `rater_name` | string | Full name of the rater |
| `rater_type` | string | `student` or `parent` |

---

### 4. Landing Page Featured Instructors

Retrieve featured instructors for the landing page.

| | |
|--|--|
| **URL** | `GET /api/users/landingpageinstructors/` |
| **Auth** | Not required (Public) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 10, max: 100) |
| `instructor__type` | string | Filter by type: `supervisor` or `normal` |
| `instructor__tags` | integer | Filter by tag ID |
| `order` | integer | Filter by display order |
| `order__gte` | integer | Min display order |
| `order__lte` | integer | Max display order |
| `search` | string | Search in instructor name, bio, email, phone |
| `ordering` | string | Order by: `order`, `instructor__joined_date`, `created_at`, `instructor__type` |

**Example Response:**

```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "instructor": {
        "id": 1,
        "name": "Dr. Ahmed Hassan",
        "email": "ahmed.hassan@example.com",
        "phone": "+201234567890",
        "bio": "Specialist in Quran memorization with 15 years of experience",
        "type": "supervisor",
        "type_display": "Supervisor",
        "image_url": "http://localhost:8000/media/instructors/ahmed_hassan.jpg",
        "joined_date": "2024-01-15"
      },
      "order": 1,
      "created_at": "2024-03-01T09:00:00Z"
    }
  ]
}
```

---

## Notes

- All datetime fields are returned in ISO 8601 format (UTC timezone)
- Image URLs are absolute URLs when the request context is available
- Phone numbers are stored in E.164 international format
- The rating system uses a scale of 1-10
- Instructor types: `supervisor` (مشرف) or `normal` (عادي)
- Tags are shared with the courses app for categorization

---

## Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/instructors/` | List instructors | Auth |
| GET | `/api/users/instructors/{id}/` | Instructor details | Public |
| GET | `/api/users/instructors/{id}/ratings/` | Instructor ratings | Auth |
| GET | `/api/users/landingpageinstructors/` | Featured instructors | Public |
