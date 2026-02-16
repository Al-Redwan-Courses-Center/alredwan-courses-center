import {
  StudentUser,
  ParentUser,
  Child,
  Enrollment,
  EnrollmentRequest,
  DashboardSummary,
  ParentDashboardSummary,
  LectureAttendance,
  ChildCardInfo,
} from "@/types/dashboard";
import { MOCK_COURSES } from "@/dev-data/courses";

// Mock Student User
export const MOCK_STUDENT_USER: StudentUser = {
  id: "student-uuid-001",
  phone_number1: "+201234567890",
  email: "ahmed.student@example.com",
  first_name: "أحمد",
  last_name: "محمد",
  dob: "2000-05-15",
  gender: "male",
  identity_number: "12345678901234",
  identity_type: "nid",
  address: "القاهرة، مصر",
  location: "المعادي",
  role: "student",
  is_verified: true,
  student_code: "STD001",
  image: null,
};

// Mock Parent User
export const MOCK_PARENT_USER: ParentUser = {
  id: "parent-uuid-001",
  phone_number1: "+201098765432",
  email: "parent@example.com",
  first_name: "محمود",
  last_name: "حسن",
  dob: "1980-03-20",
  gender: "male",
  identity_number: "98765432109876",
  identity_type: "nid",
  address: "الجيزة، مصر",
  location: "الدقي",
  role: "parent",
  is_verified: true,
  parent_code: "PAR001",
  image: null,
};

// Mock Children
export const MOCK_CHILDREN: Child[] = [
  {
    id: "child-uuid-001",
    parent_id: "parent-uuid-001",
    first_name: "فاطمة",
    last_name: "محمود",
    dob: "2015-08-10",
    gender: "female",
    child_code: "CHD001",
    image: null,
    is_active: true,
    created_at: "2024-01-10T00:00:00Z",
  },
  {
    id: "child-uuid-002",
    parent_id: "parent-uuid-001",
    first_name: "عمر",
    last_name: "محمود",
    dob: "2012-03-22",
    gender: "male",
    child_code: "CHD002",
    image: null,
    is_active: true,
    created_at: "2024-01-10T00:00:00Z",
  },
];

// Mock Children with Card Info
export const MOCK_CHILDREN_CARD_INFO: ChildCardInfo[] = MOCK_CHILDREN.map(
  (child) => ({
    ...child,
    active_courses_count: 2,
    pending_enrollments_count: 1,
    attendance_percentage: 85.5,
  }),
);

// Mock Enrollments
export const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 1,
    course: MOCK_COURSES[0],
    student_id: "student-uuid-001",
    enrollment_date: "2024-06-01",
    status: "active",
    payment_status: "paid",
    amount_paid: 1500,
    total_price: 1500,
    progress_percentage: 40,
    attendance_rate: 90,
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-20T00:00:00Z",
  },
  {
    id: 2,
    course: MOCK_COURSES[1],
    student_id: "student-uuid-001",
    enrollment_date: "2024-06-05",
    status: "active",
    payment_status: "partial",
    amount_paid: 1000,
    total_price: 2000,
    progress_percentage: 25,
    attendance_rate: 75,
    created_at: "2024-06-05T00:00:00Z",
    updated_at: "2024-06-20T00:00:00Z",
  },
];

// Mock Pending Enrollments
export const MOCK_PENDING_ENROLLMENTS: EnrollmentRequest[] = [
  {
    id: 101,
    course: MOCK_COURSES[2],
    student_id: "student-uuid-001",
    status: "pending",
    enrollment_date: "2024-06-25",
    payment_status: "unpaid",
    amount_paid: 0,
    total_price: 2000,
    expiration_date: "2024-07-05",
    created_at: "2024-06-25T00:00:00Z",
    updated_at: "2024-06-25T00:00:00Z",
  },
];

// Mock Dashboard Summary
export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  active_courses_count: 2,
  attendance_rate: 82.5,
  upcoming_lectures_count: 5,
  total_payments: 2500,
  pending_enrollments_count: 1,
};

// Mock Parent Dashboard Summary
export const MOCK_PARENT_DASHBOARD_SUMMARY: ParentDashboardSummary = {
  total_children: 2,
  total_active_courses: 4,
  total_pending_enrollments: 2,
  total_pending_payments: 3000,
  recent_payments_sum: 5000,
};

// Mock Lecture Attendance Records
export const MOCK_ATTENDANCE_RECORDS: LectureAttendance[] = [
  {
    id: 1,
    lecture_id: 1,
    lecture_title: "Python Setup & Basics",
    lecture_number: 1,
    scheduled_date: "2025-06-05",
    scheduled_start_time: "10:00:00",
    scheduled_end_time: "12:00:00",
    is_present: true,
    performance_rating: 9,
    instructor_notes: "أداء ممتاز، مشاركة فعالة",
    marked_at: "2025-06-05T12:30:00Z",
  },
  {
    id: 2,
    lecture_id: 2,
    lecture_title: "Variables and Data Types",
    lecture_number: 2,
    scheduled_date: "2025-06-08",
    scheduled_start_time: "10:00:00",
    scheduled_end_time: "12:00:00",
    is_present: true,
    performance_rating: 8,
    instructor_notes: "جيد جداً، يحتاج لمزيد من التدريب",
    marked_at: "2025-06-08T12:30:00Z",
  },
  {
    id: 3,
    lecture_id: 3,
    lecture_title: "Control Flow (If/Else)",
    lecture_number: 3,
    scheduled_date: "2025-06-12",
    scheduled_start_time: "10:00:00",
    scheduled_end_time: "12:00:00",
    is_present: false,
    performance_rating: null,
    instructor_notes: "غياب بعذر",
    marked_at: "2025-06-12T12:30:00Z",
  },
  {
    id: 4,
    lecture_id: 4,
    lecture_title: "Loops (For/While)",
    lecture_number: 4,
    scheduled_date: "2025-06-15",
    scheduled_start_time: "10:00:00",
    scheduled_end_time: "12:00:00",
    is_present: null,
    performance_rating: null,
    instructor_notes: null,
    marked_at: null,
  },
];
