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

export interface TableFilterConfig<T> {
  [key: string]: {
    filterFn: (item: T) => boolean;
    label: string;
  };
}

export type StatusMap<T extends { status: string }> = Record<
  T["status"],
  { label: string; color: StatusColors }
>;
