export interface User {
  id: string; // UUID
  phone_number1: string;
  phone_number2?: string | null;
  email?: string | null;
  first_name: string;
  last_name: string;
  // date_joined: string; // ISO Date
  dob: string; // Date string "YYYY-MM-DD"
  is_verified: boolean;
  identity_number?: string | null;
  identity_type?: "nid" | "passport" | "other" | null;
  gender: "male" | "female";
  address?: string | null;
  location?: string | null;
  role: "student" | "instructor" | "supervisor" | "parent" | "admin";
}

export interface Instructor {
  id: number;
  user: User;
  bio?: string | null;
  monthly_salary: number; // decimal
  nid_front?: string | null; // URL
  nid_back?: string | null; // URL
  image?: string | null; // URL
  joined_date: string; // Date string "YYYY-MM-DD"
  type: "supervisor" | "normal";
}

export type SeasonType = "summer_camp" | "school" | "ramadan" | "eid" | "other";

export interface Season {
  id: number;
  name: string;
  season_type: SeasonType;
  start_date: string; // Date string "YYYY-MM-DD"
  end_date?: string | null; // Date string "YYYY-MM-DD"
  description?: string | null;
  is_active: boolean;
  created_at?: string; // ISO Date
  updated_at?: string; // ISO Date
}

export interface Tag {
  id: number;
  name: string;
  created_at?: string; // ISO Date
}

export interface Course {
  id: number;
  name: string;
  description: string;
  start_date: string; // Date string "YYYY-MM-DD"
  end_date?: string | null; // Date string "YYYY-MM-DD"
  num_lectures?: number | null;
  capacity: number;
  price: number; // decimal
  is_active: boolean;
  created_at?: string; // ISO Date
  updated_at?: string; // ISO Date
  season?: Season | null;
  instructor?: Instructor | null;
  tags: Tag[];
  for_adults: boolean;
  min_age?: number | null;
  max_age?: number | null;
  slug?: string | null;
}

export enum Weekday {
  SATURDAY = 0,
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 3,
  WEDNESDAY = 4,
  THURSDAY = 5,
  FRIDAY = 6,
}

export interface CourseSchedule {
  id: number;
  course_id: number;
  weekday: Weekday;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
}

export type LectureStatus = "scheduled" | "completed" | "cancelled";

export interface Lecture {
  id: number;
  title: string;
  course: Course; // ForeignKey to Course
  day: string; // Date string "YYYY-MM-DD"
  start_time?: string | null; // "HH:MM:SS"
  end_time?: string | null; // "HH:MM:SS"
  lecture_number: number;
  instructor?: Instructor | null;
  status: LectureStatus;
  created_at?: string; // ISO Date
  updated_at?: string; // ISO Date
  attendance_taken: boolean;
}

// ------------------------------------------------------------------
// MOCK DATA
// ------------------------------------------------------------------

export const MOCK_SEASONS: Season[] = [
  {
    id: 1,
    name: "معسكر الصيف 2025",
    season_type: "summer_camp",
    start_date: "2025-06-01",
    end_date: "2025-08-31",
    description: "Intensive summer courses.",
    is_active: true,
  },
  {
    id: 2,
    name: "مدرسة الشتاء 2025",
    season_type: "school",
    start_date: "2025-09-15",
    end_date: "2025-12-20",
    is_active: false,
  },
];

export const MOCK_TAGS: Tag[] = [
  { id: 1, name: "Programming" },
  { id: 2, name: "Mathematics" },
  { id: 3, name: "Physics" },
  { id: 4, name: "Languages" },
];

export const MOCK_USER_INSTRUCTOR_1: User = {
  id: "u1-uuid-1234",
  phone_number1: "+201000000001",
  first_name: "Ahmed",
  last_name: "Ali",
  dob: "1985-05-15",
  is_verified: true,
  gender: "male",
  role: "instructor",
  email: "ahmed.ali@example.com",
};

export const MOCK_INSTRUCTOR_1: Instructor = {
  id: 101,
  user: MOCK_USER_INSTRUCTOR_1,
  monthly_salary: 5000.0,
  joined_date: "2020-01-01",
  type: "normal",
  bio: "Expert in Computer Science and Mathematics with 10 years of experience.",
};

export const MOCK_USER_INSTRUCTOR_2: User = {
  id: "u2-uuid-5678",
  phone_number1: "+201000000002",
  first_name: "Sara",
  last_name: "Mohamed",
  dob: "1990-08-20",
  is_verified: true,
  gender: "female",
  role: "instructor",
  email: "sara.mohamed@example.com",
};

export const MOCK_INSTRUCTOR_2: Instructor = {
  id: 102,
  user: MOCK_USER_INSTRUCTOR_2,
  monthly_salary: 6000.0,
  joined_date: "2021-03-15",
  type: "supervisor",
  bio: "Specialist in Physics and Chemistry.",
};

export const MOCK_COURSES: Course[] = [
  {
    id: 1,
    name: "Introduction to Python",
    description: "Learn the basics of Python programming language.",
    start_date: "2025-06-05",
    end_date: "2025-07-05",
    num_lectures: 10,
    capacity: 20,
    price: 1500.0,
    is_active: true,
    season: MOCK_SEASONS[0],
    instructor: MOCK_INSTRUCTOR_1,
    tags: [MOCK_TAGS[0]],
    for_adults: true,
    min_age: 16,
    slug: "introduction-to-python",
  },
  {
    id: 2,
    name: "Advanced Physics",
    description: "Deep dive into mechanics and thermodynamics.",
    start_date: "2025-06-10",
    end_date: "2025-08-10",
    num_lectures: 16,
    capacity: 15,
    price: 2000.0,
    is_active: true,
    season: MOCK_SEASONS[0],
    instructor: MOCK_INSTRUCTOR_2,
    tags: [MOCK_TAGS[2]],
    for_adults: false,
    max_age: 18,
    slug: "advanced-physics",
  },
];

export const MOCK_LECTURES: Lecture[] = [
  // Lectures for Course 1 (Python)
  {
    id: 1,
    title: "Python Setup & Basics",
    course: MOCK_COURSES[0],
    day: "2025-06-05",
    start_time: "10:00:00",
    end_time: "12:00:00",
    lecture_number: 1,
    instructor: MOCK_INSTRUCTOR_1,
    status: "completed",
    attendance_taken: true,
  },
  {
    id: 2,
    title: "Variables and Data Types",
    course: MOCK_COURSES[0],
    day: "2025-06-08",
    start_time: "10:00:00",
    end_time: "12:00:00",
    lecture_number: 2,
    instructor: MOCK_INSTRUCTOR_1,
    status: "completed",
    attendance_taken: true,
  },
  {
    id: 3,
    title: "Control Flow (If/Else)",
    course: MOCK_COURSES[0],
    day: "2025-06-12",
    start_time: "10:00:00",
    end_time: "12:00:00",
    lecture_number: 3,
    instructor: MOCK_INSTRUCTOR_1,
    status: "scheduled",
    attendance_taken: false,
  },
  {
    id: 4,
    title: "Loops (For/While)",
    course: MOCK_COURSES[0],
    day: "2025-06-15",
    start_time: "10:00:00",
    end_time: "12:00:00",
    lecture_number: 4,
    instructor: MOCK_INSTRUCTOR_1,
    status: "scheduled",
    attendance_taken: false,
  },

  // Lectures for Course 2 (Physics)
  {
    id: 5,
    title: "Introduction to Mechanics",
    course: MOCK_COURSES[1],
    day: "2025-06-10",
    start_time: "14:00:00",
    end_time: "16:00:00",
    lecture_number: 1,
    instructor: MOCK_INSTRUCTOR_2,
    status: "completed",
    attendance_taken: true,
  },
  {
    id: 6,
    title: "Newton's Laws",
    course: MOCK_COURSES[1],
    day: "2025-06-14",
    start_time: "14:00:00",
    end_time: "16:00:00",
    lecture_number: 2,
    instructor: MOCK_INSTRUCTOR_2,
    status: "scheduled",
    attendance_taken: false,
  },
];
