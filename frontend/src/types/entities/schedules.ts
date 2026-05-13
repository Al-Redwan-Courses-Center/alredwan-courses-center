export interface Schedule {
  day: string;
  start_time: string;
  end_time: string;
}

export interface SupervisorSchedule {
  id: number;
  instructor: number;
  instructor_name: string;
  day_of_week: number;
  day_display: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  auto_absent_after_minutes: number;
}
