# Users API Documentation

## Instructor Endpoints

### 1. List All Instructors
Get a paginated list of all instructors with filtering, searching, and ordering capabilities.

**Endpoint:** `GET /api/users/instructors/`

**Authentication:** Required

**Permissions:** 
- ✅ **Authenticated users** can view the list of instructors

**Description:** Retrieve a comprehensive list of instructors with support for filtering by type, tags, joined date, and contact information. Includes pagination and advanced search capabilities.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 10, max: 100) |
| `type` | string | Filter by instructor type: 'supervisor' or 'normal' |
| `tags` | integer | Filter by tag ID |
| `joined_date__gte` | date | Filter by joined date (greater than or equal) |
| `joined_date__lte` | date | Filter by joined date (less than or equal) |
| `user__first_name__icontains` | string | Filter by first name (case-insensitive) |
| `user__last_name__icontains` | string | Filter by last name (case-insensitive) |
| `user__phone_number1__icontains` | string | Filter by phone number |
| `user__email__icontains` | string | Filter by email |
| `search` | string | Search in first name, last name, bio, email, phone |
| `ordering` | string | Order by: joined_date, user__first_name, user__last_name, type (prefix with - for descending) |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/instructors/?page=1&page_size=10&type=supervisor&ordering=-joined_date" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
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
        {
          "id": 1,
          "name": "Quran Memorization",
          "slug": "quran-memorization"
        },
        {
          "id": 2,
          "name": "Tajweed",
          "slug": "tajweed"
        }
      ]
    },
    {
      "id": 2,
      "name": "Sheikh Mohammed Ali",
      "bio": "Expert in Islamic studies and Arabic language",
      "type": "normal",
      "type_display": "Normal",
      "image_url": "http://localhost:8000/media/instructors/mohammed_ali.jpg",
      "joined_date": "2024-02-20",
      "tags": [
        {
          "id": 3,
          "name": "Arabic Language",
          "slug": "arabic-language"
        }
      ]
    }
  ]
}
```

**Error Responses:**

**401 Unauthorized** - Authentication required:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 2. Get Instructor Details
Retrieve detailed information about a specific instructor by their ID.

**Endpoint:** `GET /api/users/instructors/<id>/`

**Authentication:** Not Required (Public)

**Permissions:** 
- ✅ **Everyone** can view instructor details

**Description:** Get comprehensive information about a specific instructor including their bio, contact information, type, and associated tags.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Instructor ID |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/instructors/1/" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "id": 1,
  "name": "Dr. Ahmed Hassan",
  "email": "ahmed.hassan@example.com",
  "phone": "+201234567890",
  "bio": "Specialist in Quran memorization with 15 years of experience. Holds a PhD in Islamic Studies and has taught over 500 students.",
  "type": "supervisor",
  "type_display": "Supervisor",
  "image_url": "http://localhost:8000/media/instructors/ahmed_hassan.jpg",
  "joined_date": "2024-01-15",
  "tags": [
    {
      "id": 1,
      "name": "Quran Memorization",
      "slug": "quran-memorization"
    },
    {
      "id": 2,
      "name": "Tajweed",
      "slug": "tajweed"
    }
  ]
}
```

**Error Responses:**

**404 Not Found** - Instructor not found:
```json
{
  "detail": "Not found."
}
```

---

### 3. Get Instructor Ratings
Retrieve aggregated ratings and individual feedback for a specific instructor.

**Endpoint:** `GET /api/users/instructors/<id>/ratings/`

**Authentication:** Required

**Permissions:** 
- ✅ **Authenticated users** can view instructor ratings

**Description:** Get comprehensive rating statistics including average ratings from both students and parents, total ratings count, and individual rating entries with feedback.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Instructor ID |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/instructors/1/ratings/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

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
      },
      {
        "id": 98,
        "rating": 8,
        "feedback": "Very helpful and explains concepts clearly",
        "created_at": "2026-02-09T10:15:00Z",
        "course_name": "Tajweed Basics",
        "rater_name": "Mohammed Hassan",
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

**Response Fields:**

**Statistics Object:**
| Field | Type | Description |
|-------|------|-------------|
| `average_rating` | float | Combined average rating from all raters (1-10) |
| `total_ratings` | integer | Total number of ratings |
| `student_ratings_count` | integer | Number of ratings from students |
| `student_average` | float | Average rating from students |
| `parent_ratings_count` | integer | Number of ratings from parents |
| `parent_average` | float | Average rating from parents |

**Rating Object:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Rating record ID |
| `rating` | integer | Rating value (1-10) |
| `feedback` | string | Optional feedback text |
| `created_at` | datetime | When the rating was created (ISO 8601) |
| `course_name` | string | Name of the course this rating is associated with |
| `rater_name` | string | Full name of the person who gave the rating |
| `rater_type` | string | Type of rater: 'student' or 'parent' |

**Error Responses:**

**401 Unauthorized** - Authentication required:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**404 Not Found** - Instructor not found:
```json
{
  "detail": "Not found."
}
```

---

### 4. Get Landing Page Featured Instructors
Retrieve the list of featured instructors displayed on the landing page.

**Endpoint:** `GET /api/users/landingpageinstructors/`

**Authentication:** Not Required (Public)

**Permissions:** 
- ✅ **Everyone** can view featured instructors

**Description:** Get instructors featured on the landing page, ordered by their display order. Supports filtering, searching, and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 10, max: 100) |
| `instructor__type` | string | Filter by instructor type: 'supervisor' or 'normal' |
| `instructor__tags` | integer | Filter by tag ID |
| `order` | integer | Filter by display order |
| `order__gte` | integer | Filter by order (greater than or equal) |
| `order__lte` | integer | Filter by order (less than or equal) |
| `search` | string | Search in instructor name, bio, email, phone |
| `ordering` | string | Order by: order, instructor__joined_date, created_at, instructor__type |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/users/landingpageinstructors/?page=1&page_size=6" \
  -H "Content-Type: application/json"
```

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
    },
    {
      "id": 2,
      "instructor": {
        "id": 3,
        "name": "Sheikh Mohammed Ali",
        "email": "mohammed.ali@example.com",
        "phone": "+201234567891",
        "bio": "Expert in Islamic studies and Arabic language",
        "type": "normal",
        "type_display": "Normal",
        "image_url": "http://localhost:8000/media/instructors/mohammed_ali.jpg",
        "joined_date": "2024-02-20"
      },
      "order": 2,
      "created_at": "2024-03-01T09:05:00Z"
    }
  ]
}
```

**Use Cases:**

1. **Landing Page Display**: Show featured instructors on the home page
2. **Instructor Showcase**: Highlight top or specialized instructors
3. **Marketing**: Feature specific instructors for promotional purposes

---

## Common Error Responses

### Authentication Error (401)
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Permission Error (403)
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Not Found Error (404)
```json
{
  "detail": "Not found."
}
```

### Validation Error (400)
```json
{
  "field_name": [
    "This field is required."
  ]
}
```

---

## Best Practices

### Frontend Integration

**1. Listing Instructors with Filters:**
```javascript
async function getInstructors(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    page_size: filters.pageSize || 10,
    ...(filters.type && { type: filters.type }),
    ...(filters.search && { search: filters.search }),
    ...(filters.ordering && { ordering: filters.ordering })
  });
  
  const response = await fetch(
    `http://localhost:8000/api/users/instructors/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
}

// Usage
getInstructors({ 
  type: 'supervisor', 
  search: 'ahmed',
  ordering: '-joined_date'
}).then(data => {
  console.log(`Found ${data.count} instructors`);
  console.log(data.results);
});
```

**2. Getting Instructor Details:**
```javascript
async function getInstructorDetails(instructorId) {
  const response = await fetch(
    `http://localhost:8000/api/users/instructors/${instructorId}/`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Instructor not found');
  }
  
  return await response.json();
}
```

**3. Displaying Instructor Ratings:**
```javascript
async function getInstructorRatings(instructorId) {
  const response = await fetch(
    `http://localhost:8000/api/users/instructors/${instructorId}/ratings/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  // Display statistics
  console.log(`Average Rating: ${data.statistics.average_rating}/10`);
  console.log(`Total Ratings: ${data.statistics.total_ratings}`);
  
  return data;
}
```

**4. Landing Page Featured Instructors:**
```javascript
async function getFeaturedInstructors() {
  const response = await fetch(
    'http://localhost:8000/api/users/landingpageinstructors/?page_size=6',
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
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

**Last Updated:** February 11, 2026
