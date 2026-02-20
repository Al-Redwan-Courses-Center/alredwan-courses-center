export interface LectureAttendanceDetail {
  id: number;
  lecture: number;
  lecture_title: string;
  participant_name: string | null;
  participant_full_name: string | null;
  participant_type: "student" | "child";
  participant_code: string | null;
  participant_image: string | null;
  participant_age: number | null;
  participant_gender: string | null;
  present: boolean | null;
  rating: number | null;
  notes: string | null;
  marked_by: number | null;
  marked_by_name: string | null;
  marked_via: "manual" | "qr_scan";
  marked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LectureAttendanceDetailsResponse {
  lecture_id: number;
  lecture_title: string;
  course_name: string | null;
  total_enrolled: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
  attendances: LectureAttendanceDetail[];
}

export interface BulkLectureAttendanceItem {
  code: string;
  participant_type: LectureAttendanceDetail["participant_type"];
  rating: NonNullable<LectureAttendanceDetail["rating"]>;
  notes?: LectureAttendanceDetail["notes"];
  present?: NonNullable<LectureAttendanceDetail["present"]>;
}

export interface BulkLectureAttendanceBody {
  marked_via: LectureAttendanceDetail["marked_via"];
  attendances: BulkLectureAttendanceItem[];
}

export interface BulkLectureAttendanceSummary {
  total_received: number;
  successful: number;
  failed: number;
  marked_by: string;
  marked_via: LectureAttendanceDetail["marked_via"];
  marked_at: string;
}

export interface BulkLectureAttendanceSuccessRecord {
  code: string;
  participant_type: LectureAttendanceDetail["participant_type"];
  participant_name: string;
  rating: NonNullable<LectureAttendanceDetail["rating"]>;
  present: NonNullable<LectureAttendanceDetail["present"]>;
  attendance_id: LectureAttendanceDetail["id"];
}

export interface BulkLectureAttendanceFailedRecord {
  index?: number;
  code: string;
  participant_type?: LectureAttendanceDetail["participant_type"];
  error: string;
}

export interface BulkLectureAttendanceResponse {
  message: string;
  lecture_id: LectureAttendanceDetailsResponse["lecture_id"];
  summary: BulkLectureAttendanceSummary;
  successful_records: BulkLectureAttendanceSuccessRecord[];
  failed_records: BulkLectureAttendanceFailedRecord[];
}
