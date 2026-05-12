export type StaffAttendanceStatus =
  | "pending"
  | "present"
  | "absent"
  | "late"
  | "not_started";

/** Check-in / row update (API may send `time` and/or legacy `check_in_time`). */
export interface StaffAttendanceUpdateData {
  id: number;
  instructor: string;
  date: string;
  status: StaffAttendanceStatus;
  /** Preferred field from WebSocket docs for check-in instant */
  time?: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
}

export interface StaffAttendanceCheckOutData {
  id: number;
  instructor: string;
  check_out_time: string;
}

export interface StaffAttendanceRatedData {
  id: number;
  instructor: string;
  instructor_id: string;
  rating: number;
  rated_by: string;
  rated_by_id: string;
  rated_at: string;
  notes: string | null;
  date: string;
  status: StaffAttendanceStatus;
}

export interface StaffAttendanceSummaryData {
  date: string;
  total_expected: number;
  checked_in: number;
  checked_out?: number;
  present: number;
  late: number;
  absent: number;
  pending?: number;
  not_started?: number;
}

// Client ==> Server
export interface StaffAttendancePingEvent {
  type: "ping";
}

export interface StaffAttendanceRequestSummaryEvent {
  type: "request_summary";
}

export type StaffAttendanceClientEvent =
  | StaffAttendancePingEvent
  | StaffAttendanceRequestSummaryEvent;

// Client <== Server
export interface ConnectionEstablishedEvent {
  type: "connection_established";
  message: string;
  user_id: string | number;
  auth_method?: "ticket" | "jwt";
}

export interface AttendanceUpdateEvent {
  type: "attendance_update";
  data: StaffAttendanceUpdateData;
}

export interface AttendanceCheckOutEvent {
  type: "attendance_check_out";
  data: StaffAttendanceCheckOutData;
}

export interface AttendanceRatedEvent {
  type: "attendance_rated";
  data: StaffAttendanceRatedData;
}

export interface SummaryResponseEvent {
  type: "summary_response";
  data: StaffAttendanceSummaryData;
}

export interface PongEvent {
  type: "pong";
}

export type StaffAttendanceServerEvent =
  | ConnectionEstablishedEvent
  | AttendanceUpdateEvent
  | AttendanceCheckOutEvent
  | AttendanceRatedEvent
  | SummaryResponseEvent
  | PongEvent;
