interface BaseLecture {
  id: number;
  title: string;
  status: "submitted" | "not-submitted";
}

interface DBLecture extends BaseLecture {
  courseName?: never;
  startTime?: never;
  endTime?: never;

  course_id: number;
  day: string;
  start_time: string;
  end_time: string;
  lecture_number: number;
  instructor_id: number;
  attendance_taken: boolean;
}

interface MockLecture extends BaseLecture {
  courseName: string;
  startTime: Date;
  endTime: Date;

  course_id?: never;
  day?: never;
  start_time?: never;
  end_time?: never;
  lecture_number?: never;
  instructor_id?: never;
  attendance_taken?: never;
}

export type Lecture = DBLecture | MockLecture;
