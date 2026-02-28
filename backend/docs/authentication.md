# 🔐 Authentication API

Authentication uses **JWT tokens** via **Djoser**. Login is via **phone number**, not email.

---

## Authentication Flow

```
1. Register ──► POST /auth/users/
2. Login    ──► POST /auth/jwt/create/   → { access, refresh }
3. Use API  ──► Authorization: JWT <access_token>
4. Expired? ──► POST /auth/jwt/refresh/  → { access }
5. Verify   ──► POST /auth/jwt/verify/
```

---

## Endpoints

### 1. Register

| | |
|--|--|
| **URL** | `POST /auth/users/` |
| **Auth** | No |

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
| `phone_number1` | string | WhatsApp number in E.164 format (e.g. `+201234567890`) |
| `password` | string | Min 8 chars, not too common |
| `re_password` | string | Must match password |
| `first_name` | string | First and second names |
| `last_name` | string | Third and fourth names |
| `dob` | date | Date of birth (`YYYY-MM-DD`) |
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

**Success (201):**
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

**Error (400):**
```json
{
  "phone_number1": ["user with this WhatsApp phone number already exists."],
  "password": ["This password is too common."],
  "non_field_errors": ["The two password fields didn't match."]
}
```

---

### 2. Login (Get JWT Tokens)

| | |
|--|--|
| **URL** | `POST /auth/jwt/create/` |
| **Auth** | No |

**Request:**
```json
{
  "phone_number1": "+201234567890",
  "password": "SecurePassword123!"
}
```

**Success (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error (401):**
```json
{
  "detail": "No active account found with the given credentials"
}
```

| Token | Purpose | Expiry |
|-------|---------|--------|
| `access` | API authentication | Short-lived |
| `refresh` | Get new access tokens | 7 days |

---

### 3. Refresh Token

| | |
|--|--|
| **URL** | `POST /auth/jwt/refresh/` |
| **Auth** | No |

**Request:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs.newAccessToken..."
}
```

---

### 4. Verify Token

| | |
|--|--|
| **URL** | `POST /auth/jwt/verify/` |
| **Auth** | No |

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success:** `200` (empty body)
**Invalid:** `401` with `"Token is invalid or expired"`

---

### 5. Get Current User Profile

| | |
|--|--|
| **URL** | `GET /auth/users/me/` |
| **Auth** | ✅ Required |

**Response (200):**
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
  "role": "instructor",
  "date_joined": "2025-01-01T10:30:00Z",
  "instructor_id": 5
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User's unique identifier |
| `phone_number1` | string | Primary WhatsApp number |
| `phone_number2` | string | Alternative phone (nullable) |
| `email` | string | Email address (nullable) |
| `first_name` | string | First and second names |
| `last_name` | string | Third and fourth names |
| `dob` | date | Date of birth |
| `gender` | string | `male` or `female` |
| `is_verified` | boolean | Account verification status |
| `identity_number` | string | Government ID (nullable) |
| `identity_type` | string | `nid`, `passport`, or `other` |
| `address` | string | Full address (nullable) |
| `location` | string | Google Maps URL (nullable) |
| `role` | string | `student`, `parent`, `instructor`, or `admin` |
| `date_joined` | datetime | Registration timestamp |
| `instructor_id` | integer | Instructor profile ID if user is an instructor, `null` otherwise |

> 💡 **Note:** The `instructor_id` field is only populated when the user has an instructor profile. Use this ID for instructor-specific API calls.

---

### 6. Update Current User Profile

| | |
|--|--|
| **URL** | `PUT` or `PATCH /auth/users/me/` |
| **Auth** | ✅ Required |

**Request (PATCH):**
```json
{
  "email": "newemail@example.com",
  "address": "123 Main St, Cairo"
}
```

---

### 7. Change Password

| | |
|--|--|
| **URL** | `POST /auth/users/set_password/` |
| **Auth** | ✅ Required |

**Request:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!",
  "re_new_password": "NewSecurePassword456!"
}
```

**Success:** `204 No Content`

---

### 8. Delete Account

| | |
|--|--|
| **URL** | `DELETE /auth/users/me/` |
| **Auth** | ✅ Required |

**Request:**
```json
{
  "current_password": "YourPassword123!"
}
```

**Success:** `204 No Content`

---

## Using JWT in Your App

### Header Format

```
Authorization: JWT <access_token>
```

> ⚠️ Use `JWT` prefix, **not** `Bearer`.

---

### JavaScript / Fetch Example

```javascript
// Login
const login = async (phone, password) => {
  const res = await fetch('http://localhost:8000/auth/jwt/create/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number1: phone, password })
  });
  const tokens = await res.json();
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  return tokens;
};

// Authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch('http://localhost:8000/auth/users/me/', {
    headers: { 'Authorization': `JWT ${token}` }
  });
  return res.json();
};

// Refresh expired token
const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  const res = await fetch('http://localhost:8000/auth/jwt/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } else {
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

### Axios Interceptor Example

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `JWT ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post('http://localhost:8000/auth/jwt/refresh/', { refresh });
        localStorage.setItem('access_token', res.data.access);
        originalRequest.headers.Authorization = `JWT ${res.data.access}`;
        return api(originalRequest);
      } catch {
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
