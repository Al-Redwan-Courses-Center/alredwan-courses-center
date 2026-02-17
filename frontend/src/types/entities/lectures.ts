export interface LectureListItem {
  id: number;
  lecture_number: number;
  title: string;
  day: string;
  scheduled_at: string;
  start_time: string;
  end_time: string;
  instructor: {
    id: number;
    full_name: string;
  };
  status: "scheduled" | "completed" | "cancelled" | "additional";
  status_display: string;
  is_accepted: true;
  attendance_taken: false;
  created_at: string;
  updated_at: string;
}
