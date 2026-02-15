# Parent API Endpoints Documentation

## Overview
This API allows authenticated parents to manage their children. The parent must be logged in with a user account that has a parent profile.

## Base URL
All endpoints are prefixed with: `/api/parents/`

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Create a Child
**POST** `/api/parents/children/create/`

Creates a new child and automatically assigns the authenticated parent as the primary parent.

**Request Body:**
```json
{
  "first_name": "محمد",
  "last_name": "أحمد علي",
  "phone": "+201234567890",  // Optional
  "dob": "2015-05-20",
  "gender": "boy",  // "boy" or "girl"
  "image": <file>  // Optional, multipart/form-data
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-here",
  "first_name": "محمد",
  "last_name": "أحمد علي",
  "phone": "+201234567890",
  "dob": "2015-05-20",
  "age": 10,
  "gender": "boy",
  "image": "cloudinary-url",
  "unique_code": "B12345",
  "primary_parent_name": "أحمد محمد",
  "created_at": "2026-02-11T10:30:00Z",
  "updated_at": "2026-02-11T10:30:00Z"
}
```

### 2. List All Children
**GET** `/api/parents/children/`

Returns all children where the authenticated user is the primary parent.

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "first_name": "محمد",
    "last_name": "أحمد علي",
    "phone": "+201234567890",
    "dob": "2015-05-20",
    "age": 10,
    "gender": "boy",
    "image": "cloudinary-url",
    "unique_code": "B12345",
    "primary_parent_name": "أحمد محمد",
    "created_at": "2026-02-11T10:30:00Z",
    "updated_at": "2026-02-11T10:30:00Z"
  }
]
```

### 3. Get Child Details
**GET** `/api/parents/children/<uuid>/`

Retrieves detailed information about a specific child.

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "first_name": "محمد",
  "last_name": "أحمد علي",
  "phone": "+201234567890",
  "dob": "2015-05-20",
  "age": 10,
  "gender": "boy",
  "image": "cloudinary-url",
  "unique_code": "B12345",
  "primary_parent_name": "أحمد محمد",
  "created_at": "2026-02-11T10:30:00Z",
  "updated_at": "2026-02-11T10:30:00Z"
}
```

### 4. Update Child
**PUT/PATCH** `/api/parents/children/<uuid>/update/`

Updates a child's information. Only the primary parent can update.

**Request Body (PATCH - partial update):**
```json
{
  "phone": "+201234567891",
  "image": <file>
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "first_name": "محمد",
  "last_name": "أحمد علي",
  "phone": "+201234567891",
  "dob": "2015-05-20",
  "age": 10,
  "gender": "boy",
  "image": "new-cloudinary-url",
  "unique_code": "B12345",
  "primary_parent_name": "أحمد محمد",
  "created_at": "2026-02-11T10:30:00Z",
  "updated_at": "2026-02-11T10:35:00Z"
}
```

### 5. Delete Child
**DELETE** `/api/parents/children/<uuid>/delete/`

Deletes a child. Only the primary parent can delete.

**Response (200 OK):**
```json
{
  "message": "Child deleted successfully",
  "child_name": "محمد أحمد علي"
}
```

## Permissions

### IsParent Permission
- User must be authenticated
- User must have a `parent_profile` relationship

### IsChildPrimaryParent Permission
- User must be authenticated
- User must be a parent
- User must be the primary parent of the specific child

## Error Responses

### 401 Unauthorized
User is not authenticated.
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
User doesn't have permission (not a parent or not the primary parent).
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
Child not found.
```json
{
  "detail": "Not found."
}
```

### 400 Bad Request
Invalid data provided.
```json
{
  "first_name": ["This field is required."],
  "dob": ["Date has wrong format. Use YYYY-MM-DD."]
}
```

## Key Features

1. **Automatic Parent Assignment**: When creating a child, the `primary_parent` field is automatically set to the authenticated parent's profile.

2. **Unique Code Generation**: Each child gets a unique code automatically generated based on their gender (e.g., "B12345" for boys, "G12345" for girls).

3. **Age Calculation**: The API automatically calculates and returns the current age of the child.

4. **Security**: Only the primary parent can view, update, or delete their children.

5. **Phone Validation**: Phone numbers are validated and normalized to E.164 format.

## Testing with cURL

### Create a Child
```bash
curl -X POST http://localhost:8000/api/parents/children/create/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "محمد",
    "last_name": "أحمد علي",
    "dob": "2015-05-20",
    "gender": "boy"
  }'
```

### List Children
```bash
curl -X GET http://localhost:8000/api/parents/children/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a Child
```bash
curl -X PATCH http://localhost:8000/api/parents/children/<UUID>/update/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+201234567890"
  }'
```
