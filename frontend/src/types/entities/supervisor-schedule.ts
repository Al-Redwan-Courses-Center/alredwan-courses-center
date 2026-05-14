export interface SupervisorScheduleCreateBody {
  instructor: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  auto_absent_after_minutes: number;
}

export interface SupervisorScheduleRow extends SupervisorScheduleCreateBody {
  id: number;
  instructor_name?: string;
}
