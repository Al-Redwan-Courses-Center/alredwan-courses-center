# 👨‍👩‍👧 Parents API Documentation

Documentation for child management endpoints. Only authenticated parents can access these endpoints.

**Base URL Prefix:** `/api/parents/`

---

## Table of Contents

1. [Create a Child](#1-create-a-child)
2. [List All Children](#2-list-all-children)
3. [Get Child Details](#3-get-child-details)
4. [Update Child](#4-update-child)
5. [Delete Child](#5-delete-child)

---

### 1. Create a Child

Creates a new child and automatically assigns the authenticated parent as the primary parent.

| | |
|--|--|
| **URL** | `POST /api/parents/children/create/` |
| **Auth** | ✅ Required (IsParent) |

**Request Body:**

```json
{
  "first_name": "محمد",
  "last_name": "أحمد علي",
  "phone": "+201234567890",
  "dob": "2015-05-20",
  "gender": "boy",
  "image": "<file>"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | Yes | Child's first name |
| `last_name` | string | Yes | Child's last name |
| `dob` | date | Yes | Date of birth (YYYY-MM-DD) |
| `gender` | string | Yes | `boy` or `girl` |
| `phone` | string | No | Phone in E.164 format |
| `image` | file | No | Profile image (multipart/form-data) |

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

---

### 2. List All Children

Returns all children where the authenticated user is the primary parent.

| | |
|--|--|
| **URL** | `GET /api/parents/children/` |
| **Auth** | ✅ Required (IsParent) |

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

---

### 3. Get Child Details

Retrieve detailed information about a specific child.

| | |
|--|--|
| **URL** | `GET /api/parents/children/{uuid}/` |
| **Auth** | ✅ Required (IsChildPrimaryParent) |

**Response (200 OK):** Same format as individual child object above.

---

### 4. Update Child

Update a child's information. Only the primary parent can update.

| | |
|--|--|
| **URL** | `PUT/PATCH /api/parents/children/{uuid}/update/` |
| **Auth** | ✅ Required (IsChildPrimaryParent) |

**Request Body (PATCH - partial update):**

```json
{
  "phone": "+201234567891",
  "image": "<file>"
}
```

**Response (200 OK):** Returns updated child object.

---

### 5. Delete Child

Delete a child. Only the primary parent can delete.

| | |
|--|--|
| **URL** | `DELETE /api/parents/children/{uuid}/delete/` |
| **Auth** | ✅ Required (IsChildPrimaryParent) |

**Response (200 OK):**

```json
{
  "message": "Child deleted successfully",
  "child_name": "محمد أحمد علي"
}
```

---

## Permissions

| Permission | Description |
|------------|-------------|
| **IsParent** | User must be authenticated and have a `parent_profile` |
| **IsChildPrimaryParent** | User must be the primary parent of the specific child |

---

## Error Responses

| Code | Description | Example |
|------|-------------|---------|
| 401 | Not authenticated | `{"detail": "Authentication credentials were not provided."}` |
| 403 | Not a parent / not primary parent | `{"detail": "You do not have permission to perform this action."}` |
| 404 | Child not found | `{"detail": "Not found."}` |
| 400 | Invalid data | `{"first_name": ["This field is required."]}` |

---

## Key Features

1. **Automatic Parent Assignment** — `primary_parent` is automatically set to the authenticated parent
2. **Unique Code Generation** — Each child gets a unique code based on gender (e.g., `B12345` for boys, `G12345` for girls)
3. **Age Calculation** — The API automatically calculates and returns the current age
4. **Security** — Only the primary parent can view, update, or delete their children
5. **Phone Validation** — Phone numbers are validated and normalized to E.164 format

---

## Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/parents/children/` | List children | Parent |
| POST | `/api/parents/children/create/` | Create child | Parent |
| GET | `/api/parents/children/{uuid}/` | Child details | Primary Parent |
| PUT/PATCH | `/api/parents/children/{uuid}/update/` | Update child | Primary Parent |
| DELETE | `/api/parents/children/{uuid}/delete/` | Delete child | Primary Parent |
