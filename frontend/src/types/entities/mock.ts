// TODO(api): Mock database types are intentionally disabled.
// export interface MockCourse {
//   id: number;
//   slug: string;
//   title: string;
//   description: string;
//   price: number;
//   capacity: number;
//   enrollments_count: number;
//   instructor: Instructor;
//   season: Season;
//   tags: Tag[];
//   start_date: string;
//   end_date: string | null;
//   stats: CourseStats;
//   images: CourseImages;
//   schedule: CourseSchedule[];
//   enrollments: Enrollment[];
//   lectures: Lecture[];
//   exams: Exam[];
// }

// TODO(api): Mock database types are intentionally disabled.
// export interface MockLectureAttendance {
//   id: number | string;
//   present: boolean;
//   rating?: number | null;
//   notes?: string;
//   lecture?: Lecture; // Circular reference possible
//   student?: Student;
//   child?: Child;
// }

// TODO(api): Mock database types are intentionally disabled.
// export interface MockLecture {
//   id: number;
//   number: number;
//   title: string;
//   date: string;
//   status: "submitted" | "pending";
//   course: Course; // Linked parent
//   attendances: LectureAttendance[];
//   // Enriched properties for Schedule View
//   course_title?: string;
//   course_image?: string;
//   start_time?: string;
//   end_time?: string;
// }

// TODO(api): Mock database types are intentionally disabled.
// export interface MockExamResult {
//   id: number;
//   marks_obtained: number;
//   percentage: number;
//   passed: boolean;
//   notes?: string;
//   exam?: Exam; // Circular reference possible
//   student?: Student;
//   child?: Child;
// }

// TODO(api): Mock database types are intentionally disabled.
// export interface MockExam {
//   id: number;
//   title: string;
//   type: string;
//   course: Course;
//   total_marks: number;
//   date: string;
//   results: ExamResult[];
// }

// TODO(api): Mock database types are intentionally disabled.
// export interface MockEnrollment {
//   id: string;
//   status: "active" | "dropped" | "completed";
//   enrolled_at: string;
//   course: Course;
//   student?: Student;
//   child?: Child;
// }

// TODO(api): Mock database types are intentionally disabled.
// export interface MockEnrollmentRequest {
//   id: string;
//   status: "pending" | "processing" | "rejected" | "accepted";
//   date: string;
//   course: Course;
//   student?: Student;
//   child?: Child;
//   parent?: Parent;
//   price: number;
//   notes?: string;
// }
