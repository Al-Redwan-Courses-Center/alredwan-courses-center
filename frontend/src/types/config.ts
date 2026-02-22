import { LectureListItem } from "./entities";

export interface JSONResponse<T> {
  status: string;
  data: T;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: T[];
}

export interface TodaysLecturesResponse {
  date: string;
  count: number;
  user_role: "instructor" | "admin/supervisor";
  lectures: TodaysLectureListItem[];
}

export type TodaysLectureListItem = LectureListItem & {
  course: {
    id: number;
    name: string;
  };
};
