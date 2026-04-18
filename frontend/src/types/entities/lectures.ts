import { CourseListItem } from "./courses";

export interface LectureCourseLite {
  id: number;
  name: string;
}

export interface LectureInstructorLite {
  id: number;
  full_name: string;
}

export interface LectureListItem {
  id: number;
  lecture_number: number;
  title: string;
  day: string;
  scheduled_at: string;
  start_time: string;
  end_time: string;
  instructor: LectureInstructorLite | null;
  course: LectureCourseLite;
  status: "scheduled" | "completed" | "cancelled" | "additional";
  status_display: string;
  is_accepted: boolean;
  attendance_taken: boolean;
  created_at: string;
  updated_at: string;
}

export interface LectureDetail extends Omit<LectureListItem, "course"> {
  duration_minutes: number | null;
  course: CourseListItem;
}
