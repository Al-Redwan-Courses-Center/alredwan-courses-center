export interface EnrollmentRequestListItem {
  id: string;
  course: number;
  course_name: string;
  course_price: string;
  child_id: string | null;
  participant_name: string | null;
  price: string | null;
  status: "pending" | "processing" | "rejected" | "accepted";
  status_display: string;
  payment_method: string | null;
  created_at: string;
  expires_at: string | null;
  notes?: string | null;
}

export interface EnrollmentListItem {
  id: string;
  course: number;
  course_name: string;
  course_price: string;
  course_start_date: string;
  course_end_date: string | null;
  course_instructor: string | null;
  child_id: string | null;
  participant_name: string | null;
  participant_type: "child" | "student" | null;
  status: string;
  status_display: string;
  enrolled_at: string;
  completed_at: string | null;
  amount_paid: string;
  remaining_amount: string;
  payment_status: "fully_paid" | "partial" | "unpaid";
  completion_percentage: number;
}

export type EnrollmentStatus =
  | "active"
  | "suspended"
  | "completed"
  | "dropped"
  | "refunded";

export interface InstructorEnrollmentListItem {
  id: string;
  course: number;
  course_name: string;
  course_start_date: string;
  course_end_date: string | null;
  participant_name: string | null;
  participant_type: "child" | "student" | null;
  participant_phone: string | null;
  status: EnrollmentStatus;
  status_display: string;
  enrolled_at: string;
  completed_at: string | null;
  completion_percentage: number;
}

// TODO(types): Unused entity type; reintroduce when an API uses it.
/*
export interface CourseEnrollmentStats {
  course_id: string;
  course_name: string;
  capacity: number;
  enrolled_count: number;
  available_spots: number;
  active_students: number;
  suspended_students: number;
  completed_students: number;
  dropped_students: number;
  refunded_students: number;
}
*/

export interface EnrollmentProgress {
  total_lectures: number;
  expected_lectures: number;
  completed_lectures: number;
  percentage: number;
  end_date_passed: boolean;
  course_end_date: string;
  is_completable: boolean;
}

export interface EnrollmentRequestCreateBody {
  course: string | number;
  child?: string;
  price?: number;
  payment_method?:
    | "cash"
    | "card"
    | "bank_transfer"
    | "instapay"
    | "vodafone_cash"
    | "other";
  notes?: string;
}
