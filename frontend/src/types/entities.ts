export interface Season {
  id: number;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Instructor {
  id: number;
  name: string;
  code: string;
  gender: "male" | "female";
  email: string | null;
  bio: string;
  image: string;
  job_title: string;
  salary: number;
  joined_at: string;
}

export interface Parent {
  id: number;
  name: string;
  code: string;
  gender: "male" | "female";
  email: string;
  phone: string;
  image: string;
  job_title: string;
}

export interface Student {
  id: number;
  name: string;
  code: string;
  gender: "male" | "female";
  dob: string;
  age: number;
  image: string;
  primary_parent?: never; // Students are independent in this model
}

export interface Child {
  id: string; // "child-1"
  name: string;
  code: string;
  gender: "male" | "female";
  dob: string;
  age: number;
  image: string;
  primary_parent: Parent;
}

// Union type for Enrollments/Attendance
export type Participant = Student | Child;

export interface Enrollment {
  id: string;
  status: "active" | "dropped" | "completed";
  enrolled_at: string;
  course: Course;
  student?: Student;
  child?: Child;
}

export interface EnrollmentRequest {
  id: string;
  status: "pending" | "processing" | "rejected" | "accepted";
  date: string;
  course: Course;
  student?: Student;
  child?: Child;
  parent?: Parent;
  price: number;
  notes?: string;
}

export interface LectureAttendance {
  id: number | string;
  present: boolean;
  rating?: number | null;
  notes?: string;
  lecture?: Lecture; // Circular reference possible
  student?: Student;
  child?: Child;
}

export interface Lecture {
  id: number;
  number: number;
  title: string;
  date: string;
  status: "submitted" | "pending";
  course: Course; // Linked parent
  attendances: LectureAttendance[];
  // Enriched properties for Schedule View
  course_title?: string;
  course_image?: string;
  start_time?: string;
  end_time?: string;
}

export interface ExamResult {
  id: number;
  marks_obtained: number;
  percentage: number;
  passed: boolean;
  notes?: string;
  exam?: Exam; // Circular reference possible
  student?: Student;
  child?: Child;
}

export interface Exam {
  id: number;
  title: string;
  type: string;
  course: Course;
  total_marks: number;
  date: string;
  results: ExamResult[];
}

export interface CourseStats {
  lectures: number;
}

export interface CourseSchedule {
  day: string;
  start: string;
  end: string;
}

export interface CourseImages {
  cover: string;
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: number;
  capacity: number;
  enrollments_count: number;
  instructor: Instructor;
  season: Season;
  tags: Tag[];
  start_date: string;
  end_date: string | null;
  stats: CourseStats;
  images: CourseImages;
  schedule: CourseSchedule[];
  enrollments: Enrollment[];
  lectures: Lecture[];
  exams: Exam[];
}
