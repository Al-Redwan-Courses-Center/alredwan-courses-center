# Complete Courses & Enrollments Feature Documentation

This document serves as an exhaustive technical and business guide to the **Courses & Enrollments** architecture within the Redwan Courses Center platform. It covers everything from underlying models and validations to API endpoints, permissions, and frontend user experiences.

---

## 1. System Architecture & Models Overview

The feature is split into two primary paradigms: **Physical (Offline) Courses** and **Online (Digital) Courses**. This separation ensures that the distinct requirements of each medium are handled correctly.

### 1.1 Physical Courses (`courses/models/course.py`)
Physical courses represent traditional, location-based or scheduled live classes.
*   **Key Fields**:
    *   `capacity`: The maximum number of students allowed to enroll. Checked against `enrolled_count`.
    *   `min_age` / `max_age`: Optional strict boundaries for age eligibility.
    *   `for_adults`: A boolean flag indicating if the course is exclusively for adults (18+).
    *   `season`: An optional reference to an academic season. Course dates must fall within the season's dates.
    *   `start_date` / `end_date` / `num_lectures`: Defines the course timeline.
*   **Core Methods**:
    *   `is_participant_eligible(participant)`: A critical method that validates whether a `StudentUser` or a `Child` is allowed to register. It computes the participant's age based on their Date of Birth (DOB) relative to the course's `start_date`.

### 1.2 Online Courses (`courses_online/models/online_course.py`)
Online courses are self-paced, digital products without seating limits or strict age restrictions at the registration level.
*   **Key Fields**:
    *   `video_lectures`: A related model containing the individual video segments, which can be embedded from external platforms (YouTube, Vimeo) or uploaded directly.
    *   `materials`: Supplementary files (PDFs, images) attached to specific lectures.
    *   `access_validity_days`: Defines how long the student has access to the course after approval (default 365 days).
    *   `allow_replay`: A flag indicating if students can rewatch completed lectures.
*   **Lack of Constraints**: Unlike physical courses, online courses do not have a `capacity` limit, and they bypass the `is_participant_eligible` checks entirely.

### 1.3 Enrollment Requests (`enrollments_payments/models/enrollment_request.py`)
Before a student is officially enrolled, their application exists as an `EnrollmentRequest`.
*   **Statuses**:
    *   `pending`: The initial state when a student or parent submits a request.
    *   `processing`: An intermediate state used by admins when a request is under review or payment is being verified.
    *   `accepted`: The request is approved, automatically triggering the creation of an official `Enrollment` record.
    *   `rejected`: The request is denied, with an optional `rejection_reason` stored for the user to see.
*   **Polymorphic Target**: A request can link to either a `course` (Physical) OR an `online_course` (Online).

---

## 2. Business Logic & Validations

### 2.1 Age Verification Rules (Physical Courses)
The `is_participant_eligible` logic enforces the following rules for physical courses:
1.  **Age Calculation**: `age = participant.get_age_on_date(course.start_date)`.
2.  **Adult Course Check**: If `for_adults` is True, the system explicitly requires `age >= 18`. If the participant is under 18, registration is blocked.
3.  **Boundary Checks**: If the instructor defined `min_age` or `max_age`, these are strictly enforced.
4.  **Standard Courses**: If `for_adults` is False and no min/max boundaries are defined, the course is available to **everyone**. Adults are not artificially blocked from standard courses.

### 2.2 Error Messaging (`get_age_requirements_msg`)
When a participant fails the eligibility check, the serializer generates a specific error message returned to the frontend:
*   If `min_age` and `max_age` are set: *"العمر المطلوب من X إلى Y سنة"*
*   If only `min_age` is set: *"العمر المطلوب X سنة فأكثر"*
*   If `for_adults` is True: *"هذه الدورة مخصصة للبالغين فقط"*
*   Fallback: *"تحقق من متطلبات العمر"*

### 2.3 Capacity Checks & Bulk Approvals
The admin system allows for the approval of multiple enrollment requests simultaneously (`BulkApproveSerializer` & `AdminBulkApproveView`).
*   **The Validation**: Before approving a request for a physical course, the system checks: `if enrollment_request.course.enrolled_count >= enrollment_request.course.capacity`.
*   **The Edge Case (Online Courses)**: Because online courses have no `capacity`, this check is conditionally bypassed (`if er.course and er.course.enrolled_count >= er.course.capacity`). Without this bypass, bulk-approving an online course would trigger an `AttributeError` (NoneType has no attribute 'enrolled_count'), crashing the transaction and preventing subsequent courses from being approved.

---

## 3. API Endpoints & Permissions

### 3.1 Course Browsing
*   `GET /api/courses/`: Lists physical courses. Permission: `AllowAny`. Supports extensive filtering (active status, price, dates, age requirements, tags).
*   `GET /api/online-courses/courses/`: Lists online courses. Permission: `AllowAny`.
*   `GET /api/courses/{id}/` & `GET /api/online-courses/courses/{id}/`: Retrieves full details. Permission: `AllowAny`. (Note: This allows the student dashboard to fetch course metadata even if the student's enrollment is still "pending").

### 3.2 Enrollment Submission
*   `POST /api/enrollment-requests/`: Submits a new request. Permission: `IsAuthenticated`.
    *   *Validation*: Blocks duplicate requests if the user already has a pending/active enrollment for the exact same course.
    *   *Validation*: Validates `is_participant_eligible` for physical courses.

### 3.3 Admin Actions
*   `POST /api/admin/enrollment-requests/{id}/approve/`: Approves a single request. Permission: `IsAdminOrSupervisor`.
*   `POST /api/admin/enrollment-requests/bulk-approve/`: Processes an array of request IDs in a single atomic transaction. Permission: `IsAdminOnly`. Generates a summary of `approved`, `failed`, and `skipped` (e.g., due to full capacity) requests.

---

## 4. Frontend Architecture & User Experience

### 4.1 UI Component: Course Cards (`StudentCourseCard.tsx`)
*   **Age Display**: Uses the exact same logic as the backend to communicate eligibility. Displays **"للبالغين (+18)"** if `for_adults` is true, otherwise dynamically formats the min/max age string, or defaults to **"الكل"**.
*   **Routing Logic**: 
    *   If `type === "online"`, the "View Course" link targets `/dashboard/online-courses/{id}/learn`.
    *   If `type === "physical"`, the link targets `/dashboard/my-courses/{id}`.

### 4.2 The Student Dashboard ("دوراتي" / My Courses)
*   **Data Aggregation (`actions/courses.ts`)**: The frontend server action fetches BOTH Physical and Online courses for the student. It cleverly merges **Active Enrollments** and **Pending Requests** into a single unified array.
*   **Visual Status**: Pending courses appear in the grid alongside active ones, but their status badge visually indicates they are awaiting admin approval.

### 4.3 The Online Course Viewer (`StudentOnlineCourseViewer.tsx`)
*   **Layout**: A dynamic two-column layout (on desktop) featuring a collapsible sidebar with the lecture index, and a main content area for video playback and material viewing.
*   **Video Integration**: The iframe dynamically adapts its source URL depending on whether the platform is YouTube (`v=` parsing), Vimeo, or a direct link.
*   **Material Rendering**: Distinguishes between image materials (rendered directly inline via `<img>` tags) and document materials (rendered as downloadable external links).
*   **Progress Tracking**: 
    *   Students click "تحديد المحاضرة كمكتملة" (Mark as Completed).
    *   This triggers `updateVideoWatchProgress`, hitting `POST /api/online-courses/courses/{id}/lectures/{id}/progress/`.
    *   The sidebar automatically recalculates the global progress bar percentage (`(completed_lectures / total_lectures) * 100`).

### 4.4 Parent vs Student Views
*   **Parent Flow**: A parent user cannot register themselves. They select a child profile, and the system evaluates the course requirements against that specific child's DOB.
*   **Dashboard Context**: In the parent dashboard, the "My Courses" view is scoped to the specific `childId` they are currently managing, displaying only the enrollments associated with that child profile.

---

## 5. Security & Edge Case Handling Summary

1.  **N+1 Query Optimization**: The `CourseListView` uses Django's `annotate` and `Count` with specific `filter=Q()` conditions to calculate active `enrolled_count` and average ratings directly in the database, avoiding N+1 performance bottlenecks during serialization.
2.  **Transaction Safety**: The admin approval process is wrapped in `transaction.atomic()`. This ensures that if creating the `Enrollment` record fails, the `EnrollmentRequest` status is not accidentally left in an inconsistent state.
3.  **Bypassing Offline Constraints for Online Data**: The architecture cleanly separates online and offline models, meaning online courses never trigger offline validation errors (like capacity limits or age bounds), preventing frustrating registration blocks.
4.  **Role Protection**: The frontend utilizes Next.js Server Actions with a custom `protect()` utility that redirects users to appropriate fallback pages (like `/dashboard/overview`) if they attempt to access course materials without the "student" or "parent" role.
