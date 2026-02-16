// Dashboard-specific types for student, parent, and child views

import { User, Instructor, Course } from "@/dev-data/courses";

// Enrollment Status
export type EnrollmentStatus = "active" | "pending" | "completed" | "rejected";

// Payment Status
export type PaymentStatus = "paid" | "partial" | "unpaid" | "pending";

// Enrollment Request
export interface EnrollmentRequest {
  id: number;
  course: Course;
  student_id: string;
  status: EnrollmentStatus;
  enrollment_date: string; // ISO Date
  rejection_reason?: string | null;
  payment_status: PaymentStatus;
  amount_paid: number;
  total_price: number;
  expiration_date?: string | null; // ISO Date for pending enrollments
  created_at: string; // ISO Date
  updated_at: string; // ISO Date
}

// Enrollment (Active)
export interface Enrollment {
  id: number;
  course: Course;
  student_id: string;
  enrollment_date: string; // ISO Date
  completion_date?: string | null; // ISO Date
  status: "active" | "completed";
  payment_status: PaymentStatus;
  amount_paid: number;
  total_price: number;
  progress_percentage: number; // 0-100
  attendance_rate: number; // 0-100
  created_at: string; // ISO Date
  updated_at: string; // ISO Date
}

// Lecture Attendance Record
export interface LectureAttendance {
  id: number;
  lecture_id: number;
  lecture_title: string;
  lecture_number: number;
  scheduled_date: string; // Date string "YYYY-MM-DD"
  scheduled_start_time: string; // "HH:MM:SS"
  scheduled_end_time: string; // "HH:MM:SS"
  is_present: boolean | null; // null = not marked yet
  performance_rating?: number | null; // 0-10
  instructor_notes?: string | null;
  marked_at?: string | null; // ISO Date
}

// Student User (extends User)
export interface StudentUser extends User {
  role: "student";
  student_code?: string | null; // Unique student identifier
  image?: string | null; // Profile image URL
}

// Parent User (extends User)
export interface ParentUser extends User {
  role: "parent";
  parent_code?: string | null; // Unique parent identifier
  image?: string | null; // Profile image URL
}

// Child
export interface Child {
  id: string; // UUID
  parent_id: string; // UUID of parent
  first_name: string;
  last_name: string;
  dob: string; // Date string "YYYY-MM-DD"
  gender: "male" | "female";
  child_code?: string | null; // Unique child identifier
  image?: string | null; // Profile image URL
  is_active: boolean;
  created_at: string; // ISO Date
}

// Dashboard Summary Statistics
export interface DashboardSummary {
  active_courses_count: number;
  attendance_rate: number; // 0-100
  upcoming_lectures_count: number;
  total_payments: number;
  pending_enrollments_count: number;
}

// Parent Dashboard Summary (Aggregated)
export interface ParentDashboardSummary {
  total_children: number;
  total_active_courses: number;
  total_pending_enrollments: number;
  total_pending_payments: number;
  recent_payments_sum: number;
}

// Child Dashboard Data
export interface ChildDashboardData {
  child: Child;
  summary: DashboardSummary;
  enrollments: Enrollment[];
  pending_enrollments: EnrollmentRequest[];
}

// Student Dashboard Data
export interface StudentDashboardData {
  student: StudentUser;
  summary: DashboardSummary;
  enrollments: Enrollment[];
  pending_enrollments: EnrollmentRequest[];
}

// Parent Dashboard Data
export interface ParentDashboardData {
  parent: ParentUser;
  children: Child[];
  summary: ParentDashboardSummary;
  pending_enrollments_by_child: {
    child_id: string;
    child_name: string;
    pending_enrollments: EnrollmentRequest[];
  }[];
}

// Course Details Data (for course details page)
export interface CourseDetailsData {
  enrollment: Enrollment;
  course: Course;
  instructor: Instructor;
  attendance_records: LectureAttendance[];
  exam_results?: ExamResult[];
}

// Exam Result
export interface ExamResult {
  id: number;
  exam_title: string;
  exam_date: string; // Date string "YYYY-MM-DD"
  score: number;
  max_score: number;
  percentage: number; // 0-100
  passed: boolean;
  remarks?: string | null;
}

// Child Card Info (for parent's children list)
export interface ChildCardInfo extends Child {
  active_courses_count: number;
  pending_enrollments_count: number;
  attendance_percentage: number; // 0-100
}
