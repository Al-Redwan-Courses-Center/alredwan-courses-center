export interface Lecture {
  id: number;
  title: string;
  courseName: string;
  startTime: Date;
  endTime: Date;
  status: "submitted" | "not-submitted";
}
