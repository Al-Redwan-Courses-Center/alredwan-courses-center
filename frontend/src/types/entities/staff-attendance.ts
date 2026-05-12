import { StaffAttendanceStatus } from "@/types/entities/staff-attendance-events";
import type { StaffAttendanceSummaryData } from "@/types/entities/staff-attendance-events";
import { Schedule } from "@/types/entities/schedules";

export type CheckInMethod =
  | "fingerprint"
  | "manual"
  | "rfid"
  | "qr_code"
  | null;

export interface StaffAttendanceDetail {
  id: number;
  instructor: number;
  instructor_name: string;
  instructor_type: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_method: CheckInMethod;
  check_out_method: CheckInMethod;
  status: "pending" | "present" | "absent" | "late";
  status_display: string;
  attendance_type: "lecture" | "supervision";
  attendance_type_display: string;
  schedule: number | null;
  schedule_info: Schedule | null;
  lecture: number | null;
  lecture_title: string | null;
  season: number;
  rating: string | null;
  rated_by: number | null;
  rated_by_name: string | null;
  rated_at: string | null;
  notes: string | null;
}

export interface StaffAttendanceListItem {
  id: number;
  instructor: number;
  instructor_name: string;
  lecture_info: { lecture_title: string; course_title: string } | null;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  scheduled_check_in_time: string;
  scheduled_check_out_time: string;
  status: StaffAttendanceStatus;
  status_display: string;
  attendance_type: "lecture" | "supervision";
  attendance_type_display: string;
  rating: number | null;
}

export interface StaffAttendanceSummary extends StaffAttendanceSummaryData {
  lecture_attendance_count: number;
  supervision_attendance_count: number;
}
