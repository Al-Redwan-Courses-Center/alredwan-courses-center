# Attendance API Documentation

## Time Restrictions

The attendance system enforces time-based restrictions to ensure data integrity:

| User Type | Past Lectures (within 24h) | Past Lectures (after 24h) | Future Lectures |
|-----------|---------------------------|--------------------------|-----------------|
| **Instructors** | ✅ Can mark | ❌ Cannot mark | ❌ Cannot mark |
| **Admins/Supervisors** | ✅ Can mark | ✅ Can mark | ❌ Cannot mark |
| **Superusers** | ✅ Can mark | ✅ Can mark | ✅ Can mark |

**Role Detection:** The system checks for admin/supervisor status using:
1. `is_superuser=True` → Superuser (full access)
2. `is_staff=True` → Admin
3. `role='admin'` or `role='supervisor'` → Based on role field
4. `instructor_profile.type='supervisor'` → Supervisor instructor

## Attendance Endpoints

### 1. Mark Single Attendance
Mark attendance for a single student or child in a lecture.

**Endpoint:** `POST /api/attendance/lecture/<lecture_id>/mark/`

**Authentication:** Required (Admin or Course Instructor only)

**Permissions:** 
- ✅ **Admins** can mark attendance for any lecture
- ✅ **Course Instructors** can only mark attendance for their own courses
- ❌ Other users cannot access this endpoint

**Time Restrictions:**
- ✅ **Instructors**: Can mark within 24 hours after lecture start
- ✅ **Admins/Supervisors**: No time restriction for past lectures
- ⚠️ **Future Lectures**: Only superusers (`is_superuser=True`) can mark attendance

**Description:** Mark attendance for a single student or child using their unique code. The attendance record must already exist in the system before marking.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lecture_id` | integer | Lecture ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | The unique code of the student or child (e.g., 'M64793') |
| `participant_type` | string | Yes | Type of participant: 'student' or 'child' |
| `rating` | integer | Yes | Rating from 1 to 10 |
| `notes` | string | No | Optional notes about the attendance |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/attendance/lecture/123/mark/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "M64793",
    "participant_type": "student",
    "rating": 8,
    "notes": "Good performance today"
  }'
```

**Example Response:**
```json
{
  "message": "Attendance marked successfully",
  "lecture_id": 123,
  "attendance": {
    "id": 456,
    "lecture": 123,
    "lecture_title": "Introduction to Quran Memorization",
    "child": null,
    "student": 15,
    "participant_name": "Ahmed Ali",
    "participant_type": "student",
    "participant_code": "M64793",
    "present": true,
    "rating": 8,
    "notes": "Good performance today",
    "marked_by": 5,
    "marked_by_name": "John Doe",
    "marked_at": "2026-02-10T10:30:00Z",
    "created_at": "2026-02-08T09:00:00Z",
    "updated_at": "2026-02-10T10:30:00Z"
  }
}
```

**Error Responses:**

**403 Forbidden** - Not authorized to mark attendance for this lecture:
```json
{
  "error": "You do not have permission to mark attendance for this lecture."
}
```

**403 Forbidden** - Time window expired (for instructors):
```json
{
  "error": "Attendance marking window has expired.",
  "details": "Attendance can only be marked within 24 hours after the lecture.",
  "lecture_start": "2026-02-20T09:00:00+02:00",
  "window_end": "2026-02-21T09:00:00+02:00"
}
```

**403 Forbidden** - Future lecture (only superusers allowed):
```json
{
  "error": "Cannot mark attendance for future lectures.",
  "details": "Only super administrators can mark attendance for lectures that have not started yet.",
  "lecture_start": "2026-02-25T09:00:00+02:00",
  "current_time": "2026-02-21T10:30:00+02:00"
}
```

**404 Not Found** - Lecture not found:
```json
{
  "error": "Lecture not found."
}
```

**400 Bad Request** - Invalid participant code:
```json
{
  "code": [
    "Student with code 'M99999' not found."
  ]
}
```

**400 Bad Request** - No attendance record:
```json
{
  "non_field_errors": [
    "No attendance record found for this student in this lecture. The attendance record must be created first."
  ]
}
```

**400 Bad Request** - Invalid rating:
```json
{
  "rating": [
    "Ensure this value is less than or equal to 10."
  ]
}
```

---

### 2. Mark Bulk Attendance
Mark attendance for multiple students/children in a lecture at once.

**Endpoint:** `POST /api/attendance/lecture/<lecture_id>/mark-bulk/`

**Authentication:** Required (Admin or Course Instructor only)

**Permissions:** 
- ✅ **Admins** can mark attendance for any lecture
- ✅ **Course Instructors** can only mark attendance for their own courses
- ❌ Other users cannot access this endpoint

**Description:** Mark attendance for multiple students and/or children in a single request. This endpoint is optimized for scenarios where you need to mark attendance for many participants at once (e.g., scanning multiple QR codes, importing from a file, or batch processing). The request includes common metadata (marked_by, marked_via, marked_at) that applies to all attendances, plus individual data for each participant.

**Key Features:**
- ⚠️ **Partial success handling**: Some records may succeed while others fail - returns both arrays
- ✅ **Individual record processing**: Each attendance is validated and marked independently
- ⚠️ **No rollback on partial failure**: Successfully marked records are persisted even if others fail
- ✅ **Detailed summary**: Get complete information about what succeeded and what failed
- ✅ **Flexible marking method**: Support for manual or QR scan
- ✅ **Individual control**: Set rating, notes, and present status for each participant
- ✅ **Permission-based access**: Only admins and course instructors can mark attendance

**Important:** Unlike a true atomic "all-or-nothing" transaction, this endpoint uses **partial commit**. If 8 out of 10 records succeed, those 8 WILL be saved to the database, and only the 2 failures will be reported in `failed_records`. Your client application MUST handle both success and failure arrays and should NOT retry successful records.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lecture_id` | integer | Lecture ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `marked_via` | string | No | Method used: 'manual' or 'qr_scan' (default: 'manual') |
| `attendances` | array | Yes | Array of attendance records (minimum 1) |

**Attendance Item Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | The unique code of the student or child |
| `participant_type` | string | Yes | Type: 'student' or 'child' |
| `rating` | integer | Yes | Rating from 1 to 10 |
| `notes` | string | No | Optional notes (default: empty string) |
| `present` | boolean | No | Whether present (default: true) |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/attendance/lecture/123/mark-bulk/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marked_via": "qr_scan",
    "attendances": [
      {
        "code": "M64793",
        "participant_type": "student",
        "rating": 8,
        "notes": "Good performance",
        "present": true
      },
      {
        "code": "C12345",
        "participant_type": "child",
        "rating": 9,
        "notes": "Excellent participation",
        "present": true
      },
      {
        "code": "M54321",
        "participant_type": "student",
        "rating": 7,
        "notes": "Needs improvement",
        "present": true
      },
      {
        "code": "C67890",
        "participant_type": "child",
        "rating": 10,
        "notes": "Outstanding",
        "present": true
      }
    ]
  }'
```

**Example Response (All Successful):**
```json
{
  "message": "Bulk attendance marking completed",
  "lecture_id": 123,
  "summary": {
    "total_received": 4,
    "successful": 4,
    "failed": 0,
    "marked_by": "John Doe",
    "marked_via": "qr_scan",
    "marked_at": "2026-02-10T10:30:00Z"
  },
  "successful_records": [
    {
      "code": "M64793",
      "participant_type": "student",
      "participant_name": "Ahmed Ali",
      "rating": 8,
      "present": true,
      "attendance_id": 456
    },
    {
      "code": "C12345",
      "participant_type": "child",
      "participant_name": "Fatima",
      "rating": 9,
      "present": true,
      "attendance_id": 457
    },
    {
      "code": "M54321",
      "participant_type": "student",
      "participant_name": "Mohammed Hassan",
      "rating": 7,
      "present": true,
      "attendance_id": 458
    },
    {
      "code": "C67890",
      "participant_type": "child",
      "participant_name": "Sara",
      "rating": 10,
      "present": true,
      "attendance_id": 459
    }
  ],
  "failed_records": []
}
```

**Example Response (Partial Success - HTTP 207 Multi-Status):**
```json
{
  "message": "Bulk attendance marking completed",
  "lecture_id": 123,
  "summary": {
    "total_received": 5,
    "successful": 3,
    "failed": 2,
    "marked_by": "John Doe",
    "marked_via": "manual",
    "marked_at": "2026-02-10T10:30:00Z"
  },
  "successful_records": [
    {
      "code": "M64793",
      "participant_type": "student",
      "participant_name": "Ahmed Ali",
      "rating": 8,
      "present": true,
      "attendance_id": 456
    },
    {
      "code": "C12345",
      "participant_type": "child",
      "participant_name": "Fatima",
      "rating": 9,
      "present": true,
      "attendance_id": 457
    },
    {
      "code": "M54321",
      "participant_type": "student",
      "participant_name": "Mohammed Hassan",
      "rating": 7,
      "present": true,
      "attendance_id": 458
    }
  ],
  "failed_records": [
    {
      "index": 3,
      "code": "M99999",
      "error": "Student with code 'M99999' not found."
    },
    {
      "index": 4,
      "code": "C88888",
      "error": "No attendance record found for this child in this lecture."
    }
  ]
}
```

**Response Status Codes:**
| Status | When |
|--------|------|
| 200 OK | All attendances marked successfully |
| 207 Multi-Status | Some succeeded, some failed |
| 400 Bad Request | All failed or validation error |
| 404 Not Found | Lecture not found |

**Response Fields:**

**Summary Object:**
| Field | Type | Description |
|-------|------|-------------|
| `total_received` | integer | Total number of attendances in the request |
| `successful` | integer | Number of successfully marked attendances |
| `failed` | integer | Number of failed attendances |
| `marked_by` | string | Name of the user who marked the attendance |
| `marked_via` | string | Method used: 'manual' or 'qr_scan' |
| `marked_at` | datetime | When the attendance was marked (ISO 8601) |

**Successful Record Object:**
| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Participant code |
| `participant_type` | string | Type: 'student' or 'child' |
| `participant_name` | string | Full name of the participant |
| `rating` | integer | Rating given (1-10) |
| `present` | boolean | Whether marked as present |
| `attendance_id` | integer | ID of the attendance record |

**Failed Record Object:**
| Field | Type | Description |
|-------|------|-------------|
| `index` | integer | Index in the original request array (optional) |
| `code` | string | Participant code that failed |
| `error` | string | Description of why it failed |

**Error Responses:**

**403 Forbidden** - Not authorized to mark attendance for this lecture:
```json
{
  "error": "You do not have permission to mark attendance for this lecture."
}
```

**404 Not Found** - Lecture not found:
```json
{
  "error": "Lecture with id 999 not found."
}
```

**400 Bad Request** - Empty attendances array:
```json
{
  "attendances": [
    "This list may not be empty."
  ]
}
```

**400 Bad Request** - Invalid marked_via:
```json
{
  "marked_via": [
    "\"invalid\" is not a valid choice."
  ]
}
```

**400 Bad Request** - Missing required fields:
```json
{
  "attendances": [
    {
      "code": [
        "This field is required."
      ],
      "rating": [
        "This field is required."
      ]
    }
  ]
}
```

**400 Bad Request** - Time window restriction (non-admin users):
```json
{
  "non_field_errors": [
    "Attendance can only be marked within the allowed time window (from 24 hours before lecture start until 24 hours after)."
  ]
}
```

**Use Cases:**

1. **QR Code Scanning**: Mark attendance as students scan QR codes at lecture entrance
2. **Batch Import**: Import attendance data from CSV/Excel files
3. **Mobile App**: Mark multiple attendances collected offline and sync later
4. **Manual Entry**: Staff entering attendance for multiple students at once
5. **Make-up Sessions**: Mark attendance for multiple students attending a make-up lecture

**Best Practices:**

1. **Validate before sending**: Check participant codes exist before bulk submission
2. **Handle partial success**: Always check both successful and failed arrays
3. **Retry logic**: Implement retry for failed records with appropriate backoff
4. **Progress feedback**: Show progress UI when processing large batches
5. **Chunk large requests**: Split very large batches (>100) into smaller chunks

**Frontend Integration Example:**
```javascript
async function markBulkAttendance(lectureId, attendances, markedVia = 'manual') {
  const response = await fetch(
    `http://localhost:8000/api/attendance/lecture/${lectureId}/mark-bulk/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marked_via: markedVia,
        attendances: attendances
      })
    }
  );
  
  const result = await response.json();
  
  // Handle results
  if (result.summary.failed > 0) {
    console.warn(`${result.summary.failed} attendances failed:`);
    result.failed_records.forEach(fail => {
      console.error(`- ${fail.code}: ${fail.error}`);
    });
  }
  
  console.log(`Successfully marked ${result.summary.successful} attendances`);
  return result;
}

// Usage
const attendances = [
  { code: 'M64793', participant_type: 'student', rating: 8, notes: 'Great' },
  { code: 'C12345', participant_type: 'child', rating: 9, notes: 'Excellent' }
];

markBulkAttendance(123, attendances, 'qr_scan')
  .then(result => {
    // Update UI with results
    updateAttendanceUI(result);
  })
  .catch(error => {
    console.error('Bulk attendance failed:', error);
  });
}
```

---

### 3. Get Lecture Attendance Details
Get detailed attendance information for a specific lecture including all participants.

**Endpoint:** `GET /api/attendance/lecture/<lecture_id>/details/`

**Authentication:** Required (Admin or Course Instructor only)

**Permissions:** 
- ✅ **Admins** can view attendance for any lecture
- ✅ **Course Instructors** can only view attendance for their own courses
- ❌ Other users cannot access this endpoint

**Description:** Returns all attendance records for a lecture with full participant details, including real-time information about whether the current user can submit or edit attendance.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lecture_id` | integer | Lecture ID |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/attendance/lecture/123/details/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "lecture_id": 123,
  "lecture_title": "Lecture 1 - Introduction",
  "course_name": "Quran Memorization",
  "lecture_date": "2026-02-20",
  "lecture_start_time": "09:00:00",
  "is_future_lecture": false,
  "is_attendance_submittable": true,
  "is_editable": true,
  "submission_deadline": "2026-02-21T09:00:00+02:00",
  "user_can_bypass_deadline": false,
  "user_can_mark_future_lectures": false,
  "total_enrolled": 15,
  "present_count": 12,
  "absent_count": 3,
  "not_marked_count": 0,
  "attendance_rate": 80.0,
  "attendances": [
    {
      "id": 1,
      "participant_name": "أحمد",
      "participant_full_name": "أحمد محمد",
      "participant_type": "child",
      "participant_code": "M12345",
      "participant_image": "https://res.cloudinary.com/.../image.jpg",
      "participant_age": 12,
      "participant_gender": "boy",
      "present": true,
      "rating": 8,
      "notes": "ممتاز",
      "marked_at": "2026-02-20T10:30:00Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `lecture_id` | integer | ID of the lecture |
| `lecture_title` | string | Title of the lecture |
| `course_name` | string | Name of the course |
| `lecture_date` | string | Date of the lecture (YYYY-MM-DD) |
| `lecture_start_time` | string | Start time of the lecture (HH:MM:SS) |
| `is_future_lecture` | boolean | True if lecture hasn't started yet |
| `is_attendance_submittable` | boolean | True if current user can submit new attendance |
| `is_editable` | boolean | True if current user can edit existing attendance |
| `submission_deadline` | string/null | ISO datetime when window closes (null for admins or future lectures) |
| `user_can_bypass_deadline` | boolean | True if user is admin/supervisor |
| `user_can_mark_future_lectures` | boolean | True if user is superuser |
| `total_enrolled` | integer | Total participants enrolled in the lecture |
| `present_count` | integer | Number marked as present |
| `absent_count` | integer | Number marked as absent |
| `not_marked_count` | integer | Number not yet marked |
| `attendance_rate` | float | Percentage of present (0-100) |
| `attendances` | array | List of attendance records |

**Permission Logic for `is_attendance_submittable` and `is_editable`:**

| Lecture Type | User Type | `is_attendance_submittable` | `is_editable` |
|--------------|-----------|---------------------------|--------------|
| Future | Superuser | ✅ true | ✅ true |
| Future | Admin/Supervisor | ❌ false | ❌ false |
| Future | Instructor | ❌ false | ❌ false |
| Past (within 24h) | Any authorized user | ✅ true | ✅ true |
| Past (after 24h) | Admin/Supervisor | ✅ true | ✅ true |
| Past (after 24h) | Instructor | ❌ false | ❌ false |
