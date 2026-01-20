import { StatusColors } from "@/components/ui/StatusBadge";

//
// MARK: TABLE
//
export interface TableSortConfig<T> {
  [key: string]: {
    sortFn: (a: T, b: T) => number;
    label: string;
  };
}

export interface TableFilterConfig {
  [key: string]: {
    key: string;
    label: string;
  };
}

export type StatusMap<T extends { status: string }> = Record<
  T["status"],
  { label: string; color: StatusColors }
>;
