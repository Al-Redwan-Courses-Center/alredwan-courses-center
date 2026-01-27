# Authentication API Documentation

This document provides detailed information about the authentication endpoints for frontend developers.

**Base URL:** `http://localhost:8000`  
**Auth Prefix:** `/auth/`

---

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [Endpoints](#endpoints)
  - [Register User](#1-register-user)
  - [Login (Create JWT)](#2-login-create-jwt)
  - [Refresh Token](#3-refresh-token)
  - [Verify Token](#4-verify-token)
  - [Get Current User](#5-get-current-user)
  - [Update Current User](#6-update-current-user)
  - [Change Password](#7-change-password)
  - [Delete Account](#8-delete-account)
- [Using JWT Tokens](#using-jwt-tokens)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

This API uses **JWT (JSON Web Tokens)** for authentication via **Djoser**.

**Key Points:**
- Authentication is done via **phone number** (`phone_number1`), not email or username
- Phone numbers must be in **E.164 international format** (e.g., `+201234567890`)
- Access tokens are short-lived; refresh tokens are used to obtain new access tokens
- Include tokens in the `Authorization` header with `JWT` prefix

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Register ──► POST /auth/users/                              │
│                                                                  │
│  2. Login ────► POST /auth/jwt/create/                          │
│                 Returns: { access, refresh }                     │
│                                                                  │
│  3. Use API ──► Include "Authorization: JWT <access_token>"     │
│                                                                  │
│  4. Token Expired? ──► POST /auth/jwt/refresh/                  │
│                        Returns: { access }                       │
│                                                                  │
│  5. Verify Token ──► POST /auth/jwt/verify/                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoints

### 1. Register User

Create a new user account.

| Property | Value |
|----------|-------|
| **URL** | `/auth/users/` |
| **Method** | `POST` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "phone_number1": "+201234567890",
  "password": "SecurePassword123!",
  "re_password": "SecurePassword123!",
  "first_name": "أحمد يوسف",
  "last_name": "محمد علي",
  "dob": "1995-05-15",
  "gender": "male"
}
```

**Required Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `phone_number1` | string | WhatsApp phone number in E.164 format |
| `password` | string | Password (min 8 chars, not too common) |
| `re_password` | string | Password confirmation |
| `first_name` | string | First and second names |
| `last_name` | string | Third and fourth names |
| `dob` | date | Date of birth (YYYY-MM-DD) |
| `gender` | string | `male` or `female` |

**Optional Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `phone_number2` | string | Alternative phone number |
| `email` | string | Email address |
| `identity_number` | string | Government ID / Passport |
| `identity_type` | string | `nid`, `passport`, or `other` |
| `address` | string | Full address |
| `location` | string | Google Maps URL |

**Success Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone_number1": "+201234567890",
  "first_name": "أحمد",
  "last_name": "محمد علي",
  "email": null,
  "dob": "1995-05-15",
  "gender": "male"
}
```

**Error Response (400 Bad Request):**

```json
{
  "phone_number1": ["user with this WhatsApp phone number already exists."],
  "password": ["This password is too common."],
  "non_field_errors": ["The two password fields didn't match."]
}
```

---

### 2. Login (Create JWT)

Authenticate and receive JWT tokens.

| Property | Value |
|----------|-------|
| **URL** | `/auth/jwt/create/` |
| **Method** | `POST` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "phone_number1": "+201234567890",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzA0MzA1NjAwLCJpYXQiOjE3MDQzMDIwMDAsImp0aSI6IjEyMzQ1Njc4OTAiLCJ1c2VyX2lkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIn0.abc123",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTcwNDkwNjgwMCwiaWF0IjoxNzA0MzAyMDAwLCJqdGkiOiIwOTg3NjU0MzIxIiwidXNlcl9pZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9.xyz789"
}
```

**Error Response (401 Unauthorized):**

```json
{
  "detail": "No active account found with the given credentials"
}
```

**Token Details:**

| Token | Purpose | Typical Expiry |
|-------|---------|----------------|
| `access` | Used for API authentication | 5-60 minutes |
| `refresh` | Used to get new access tokens | 1-7 days |

---

### 3. Refresh Token

Get a new access token using a refresh token.

| Property | Value |
|----------|-------|
| **URL** | `/auth/jwt/refresh/` |
| **Method** | `POST` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccessToken..."
}
```

**Error Response (401 Unauthorized):**

```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### 4. Verify Token

Check if a token is still valid.

| Property | Value |
|----------|-------|
| **URL** | `/auth/jwt/verify/` |
| **Method** | `POST` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**

```json
{}
```

**Error Response (401 Unauthorized):**

```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### 5. Get Current User

Retrieve the authenticated user's profile.

| Property | Value |
|----------|-------|
| **URL** | `/auth/users/me/` |
| **Method** | `GET` |
| **Auth Required** | ✅ Yes |

**Headers:**

```
Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone_number1": "+201234567890",
  "phone_number2": null,
  "email": "user@example.com",
  "first_name": "أحمد يوسف",
  "last_name": "محمد علي",
  "dob": "1995-05-15",
  "gender": "male",
  "is_verified": false,
  "identity_number": null,
  "identity_type": "nid",
  "address": null,
  "location": null,
  "role": "student",
  "date_joined": "2025-01-01T10:30:00Z"
}
```

**Error Response (401 Unauthorized):**

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 6. Update Current User

Update the authenticated user's profile.

| Property | Value |
|----------|-------|
| **URL** | `/auth/users/me/` |
| **Method** | `PUT` / `PATCH` |
| **Auth Required** | ✅ Yes |

**Headers:**

```
Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body (PATCH - partial update):**

```json
{
  "email": "newemail@example.com",
  "address": "123 Main St, Cairo, Egypt"
}
```

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone_number1": "+201234567890",
  "email": "newemail@example.com",
  "first_name": "أحمد",
  "last_name": "محمد علي",
  "address": "123 Main St, Cairo, Egypt"
  // ... other fields
}
```

---

### 7. Change Password

Change the authenticated user's password.

| Property | Value |
|----------|-------|
| **URL** | `/auth/users/set_password/` |
| **Method** | `POST` |
| **Auth Required** | ✅ Yes |

**Headers:**

```
Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!",
  "re_new_password": "NewSecurePassword456!"
}
```

**Success Response (204 No Content):**

No body returned.

**Error Response (400 Bad Request):**

```json
{
  "current_password": ["Invalid password."],
  "new_password": ["This password is too short. It must contain at least 8 characters."],
  "non_field_errors": ["The two password fields didn't match."]
}
```

---

### 8. Delete Account

Delete the authenticated user's account.

| Property | Value |
|----------|-------|
| **URL** | `/auth/users/me/` |
| **Method** | `DELETE` |
| **Auth Required** | ✅ Yes |

**Headers:**

```
Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**

```json
{
  "current_password": "YourPassword123!"
}
```

**Success Response (204 No Content):**

No body returned.

---

## Using JWT Tokens

### HTTP Header Format

For all authenticated requests, include the JWT token in the `Authorization` header:

```
Authorization: JWT <access_token>
```

**⚠️ Important:** Use `JWT` prefix, not `Bearer`.

### JavaScript/TypeScript Example

```javascript
// Store tokens after login
const login = async (phone, password) => {
  const response = await fetch('http://localhost:8000/auth/jwt/create/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number1: phone, password })
  });
  
  const tokens = await response.json();
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  return tokens;
};

// Make authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/auth/users/me/', {
    headers: { 'Authorization': `JWT ${token}` }
  });
  return response.json();
};

// Refresh token when expired
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('http://localhost:8000/auth/jwt/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } else {
    // Refresh token expired, redirect to login
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

### Axios Interceptor Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `JWT ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('http://localhost:8000/auth/jwt/refresh/', {
          refresh: refreshToken
        });
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `JWT ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created (registration) |
| `204` | No Content | Success with no response body |
| `400` | Bad Request | Validation errors, missing fields |
| `401` | Unauthorized | Invalid/expired token, wrong credentials |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |

### Error Response Format

```json
{
  "field_name": ["Error message 1", "Error message 2"],
  "another_field": ["Error message"],
  "non_field_errors": ["General error not tied to a specific field"],
  "detail": "Single error message (for auth errors)"
}
```

---

## Best Practices

### Security

1. **Never store tokens in plain localStorage for production** — Consider using httpOnly cookies or secure storage
2. **Always use HTTPS in production**
3. **Implement token refresh logic** to maintain user sessions
4. **Clear tokens on logout**

### Token Management

```javascript
// Logout function
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // Redirect to login page
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};
```

### Phone Number Format

Always send phone numbers in E.164 format:

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `01234567890` | `+201234567890` |
| `(02) 1234-5678` | `+20212345678` |
| `1234567890` | `+201234567890` |

---

## Quick Reference

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Register | POST | `/auth/users/` | No |
| Login | POST | `/auth/jwt/create/` | No |
| Refresh Token | POST | `/auth/jwt/refresh/` | No |
| Verify Token | POST | `/auth/jwt/verify/` | No |
| Get Profile | GET | `/auth/users/me/` | Yes |
| Update Profile | PATCH | `/auth/users/me/` | Yes |
| Change Password | POST | `/auth/users/set_password/` | Yes |
| Delete Account | DELETE | `/auth/users/me/` | Yes |

---

## Support

For questions or issues with authentication, contact the backend team or check the main [README.md](../README.md).
