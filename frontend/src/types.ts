import { StatusColors } from "@/components/ui/StatusBadge";

export interface JSONResponse<T> {
  status: string;
  data: T;
}

export interface Lecture {
  id: number;
  title: string;
  courseName: string;
  startTime: Date;
  endTime: Date;
  status: "submitted" | "not-submitted";
}

export interface TableSortConfig<T> {
  [key: string]: {
    sortFn: (a: T, b: T) => number;
    label: string;
  };
}

export type StatusMap<T extends { status: string }> = Record<
  T["status"],
  { label: string; color: StatusColors }
>;
