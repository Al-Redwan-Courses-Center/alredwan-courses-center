export type StaffAttendanceStatus =
  | "pending"
  | "present"
  | "absent"
  | "late"
  | "not_started";

export interface StaffAttendanceUpdateData {
  id: number;
  instructor: string;
  instructor_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  status: StaffAttendanceStatus;
  date: string;
}

export interface StaffAttendanceSummaryData {
  date: string;
  total_expected: number;
  checked_in: number;
  checked_out: number;
  present: number;
  late: number;
  absent: number;
  pending: number;
  not_started: number;
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
  user_id: string;
}

export interface AttendanceUpdateEvent {
  type: "attendance_update";
  data: StaffAttendanceUpdateData;
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
  | SummaryResponseEvent
  | PongEvent;
