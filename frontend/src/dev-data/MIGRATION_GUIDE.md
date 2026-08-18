# Migration Guide: Refactoring to Mock Database

We have consolidated the scattered development data into a single, structured JSON file: `frontend/src/dev-data/mock_db.json`. This new structure mirrors the backend PostgreSQL database schema, making future API integration much smoother.

## Overview of Changes

*   **Old Way**: Multiple `.ts` files (`courses.ts`, `instructors.ts`, etc.) exporting constant arrays.
*   **New Way**: Single `mock_db.json` file acting as a database. Relationships are linked by IDs (e.g., `instructor_id` in `courses` points to `instructors`).

## Steps to Migrate

### 1. Create a Data Access Utility

Create a helper file (e.g., `frontend/src/lib/mock-db.ts`) to read and parse the mock database. This will simulate API calls.

```typescript
// frontend/src/lib/mock-db.ts
import db from '@/dev-data/mock_db.json';
import { Course, Instructor, Season, Lecture } from '@/types/entities'; // Ensure types match new structure

// Helper to simulate network delay (optional)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockDB = {
  async getCourses(): Promise<any[]> {
    await delay(200);
    // Join with instructors and seasons if needed
    return db.courses.map(course => ({
      ...course,
      instructor: db.instructors.find(i => i.id === course.instructor_id),
      season: db.seasons.find(s => s.id === course.season_id),
    }));
  },

  async getCourseById(id: number): Promise<any | undefined> {
    await delay(100);
    const course = db.courses.find(c => c.id === id);
    if (!course) return undefined;
    return {
      ...course,
      instructor: db.instructors.find(i => i.id === course.instructor_id),
      season: db.seasons.find(s => s.id === course.season_id),
      lectures: db.lectures.filter(l => l.course_id === id)
    };
  },

  async getInstructors(): Promise<any[]> {
    await delay(200);
    return db.instructors.map(inst => ({
      ...inst,
      user: db.users.find(u => u.id === inst.user_id)
    }));
  }
};
```

### 2. Update Components

Replace direct imports with the utility calls.

**Before:**
```typescript
import { MOCK_COURSES } from '@/dev-data/courses';

const CourseList = () => {
  const courses = MOCK_COURSES;
  return <div>...</div>;
}
```

**After:**
```typescript
import { MockDB } from '@/lib/mock-db';
import { useEffect, useState } from 'react';

const CourseList = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    MockDB.getCourses().then(data => setCourses(data));
  }, []);

  return <div>...</div>;
}
```

### 3. Deprecate Old Files

Once all components are updated to use `MockDB` (or `mock_db.json` directly), you can safely delete the old `.ts` files in `frontend/src/dev-data`.

## Benefits

1.  **Backend Parity**: The JSON structure matches the backend Django models (Foreign Keys, Date formats).
2.  **Centralized Data**: Easier to update and maintain consistent data across the app.
3.  **API Readiness**: Fetching data asynchronously from the mock DB prepares your components for real API calls (using `fetch` or `axios`) with minimal code changes later.
