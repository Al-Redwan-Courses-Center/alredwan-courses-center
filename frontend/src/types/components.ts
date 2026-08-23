import type { StatusColors } from "@/components/ui/StatusBadge";

//
// MARK: TABLE
//
export interface DataViewSortConfig<T> {
  [key: string]: {
    sortFn: (a: T, b: T) => number;
    label: string;
  };
}

export interface DataViewFilterConfig {
  [key: string]: {
    key: string;
    label: string;
  };
}

export type StatusMap<T extends { status: string }> = Record<
  T["status"],
  { label: string; color: StatusColors }
>;

export interface AccordionItemData {
  id: string;
  header: {
    title: string;
    days?: string;
  };
  content: React.ReactNode;
}
