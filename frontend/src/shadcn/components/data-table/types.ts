import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

/** A single search input config bound to a column key. */
export interface DataTableSearchConfig {
  /** Column accessorKey to filter on. */
  searchKey: string;
  /** Placeholder text shown inside the input. */
  placeholder?: string;
}

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilterConfig {
  columnId: string;
  label: string;
  options: DataTableFilterOption[];
}

export interface DataTablePaginationOptions {
  onPrevious?: (nextPage: number, currentPage: number) => void;
  onNext?: (nextPage: number, currentPage: number) => void;
  onPageChange?: (nextPage: number, currentPage: number) => void;
}

export interface DataTableRemoteState {
  /** Zero-based page index controlled by the parent (backend mode). */
  pageIndex?: number;
  /** Total pages from backend when manual pagination is enabled. */
  pageCount?: number;
  /** Controlled sorting state from parent. */
  sorting?: SortingState;
  /** Controlled filters state from parent. */
  columnFilters?: ColumnFiltersState;
  /** Controlled search input value from parent. */
  searchValue?: string;
}

export interface DataTableMobileContentItem {
  /** Optional stable key for react rendering. */
  key?: string;
  /** Field label displayed on the right side in RTL. */
  label: ReactNode;
  /** Field value displayed beside the label. */
  value: ReactNode;
}

/**
 * Configuration for how a single row renders in the mobile accordion view.
 */
export interface DataTableMobileConfig<TData> {
  /** Renders the accordion item trigger (title line). */
  renderTitle: (row: TData, index: number) => ReactNode;
  /** Optional subtitle shown alongside the title. */
  renderSubtitle?: (row: TData) => ReactNode;
  /**
   * Returns a standardized list of fields rendered by the mobile accordion body.
   * This keeps the mobile layout unified across all DataTable usages.
   */
  getContentItems?: (row: TData) => DataTableMobileContentItem[];
  /** Optional action row rendered at the bottom of expanded content. */
  renderActions?: (row: TData) => ReactNode;
}

export interface DataTableProps<TData, TValue> {
  /** TanStack column definitions – see shadcn data-table docs. */
  columns: ColumnDef<TData, TValue>[];
  /** Row data array. */
  data: TData[];

  /**
   * Array of search inputs, each bound to a different column.
   * Use this for single or multiple search fields.
   */
  searches?: DataTableSearchConfig[];

  manualPagination?: boolean;
  /** When true, filtering logic is driven by backend. */
  manualFiltering?: boolean;
  /** When true, sorting logic is driven by backend. */
  manualSorting?: boolean;
  /** Controls loading skeleton for table + mobile UI. */
  isLoading?: boolean;
  /** Shows a spinner at the bottom of the mobile list while loading more pages. */
  isFetchingMore?: boolean;
  /** Number of skeleton rows/cards to show while loading. */
  loadingRowsCount?: number;
  /** Controlled state for backend mode; optional and granular. */
  remoteState?: DataTableRemoteState;
  /** Called whenever pagination changes (zero-based page index). */
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  /** Called whenever sorting changes. */
  onSortingChange?: (sorting: SortingState) => void;
  /** Called whenever filters change. */
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  /** Called whenever search text changes (first search key). */
  onSearchChange?: (searchValue: string) => void;

  /** Configuration for the mobile accordion view. */
  mobileConfig?: DataTableMobileConfig<TData>;
  /** Number of rows per page (default: 7). */
  pageSize?: number;
  /** Additional classes on the root wrapper. */
  className?: string;
  /**
   * Whether to show a sort dropdown on mobile view.
   * @default false
   */
  showMobileSortDropdown?: boolean;
  /** Optional custom filters (e.g. status: registered / not registered). */
  filters?: DataTableFilterConfig[];
  /** Enables a dropdown menu to toggle column visibility. */
  showColumnVisibilityToggle?: boolean;
  /** Optional callbacks for custom pagination actions (e.g. prefetch). */
  paginationOptions?: DataTablePaginationOptions;
}

/**
 * Props accepted by the generic `<DataCards />` component.
 */
export interface DataCardsProps<TData, TValue> {
  /** When true, pagination logic is driven by backend. */
  manualPagination?: boolean;
  /** When true, filtering logic is driven by backend. */
  manualFiltering?: boolean;
  /** When true, sorting logic is driven by backend. */
  manualSorting?: boolean;
  /** Controls loading skeleton for card grid UI. */
  isLoading?: boolean;
  /** Shows a spinner at the bottom of the mobile card grid while fetching the next page. */
  isFetchingMore?: boolean;
  /** Number of skeleton cards to show while loading. */
  loadingRowsCount?: number;
  /** Controlled state for backend mode; optional and granular. */
  remoteState?: DataTableRemoteState;
  /** Called whenever pagination changes (zero-based page index). */
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  /** Called whenever sorting changes. */
  onSortingChange?: (sorting: SortingState) => void;
  /** Called whenever filters change. */
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  /** Called whenever search text changes. */
  onSearchChange?: (searchValue: string) => void;
  /** TanStack column definitions used for searching and sorting logic. */
  columns: ColumnDef<TData, TValue>[];
  /** Row data array. */
  data: TData[];
  /** Render function for each individual card. */
  renderCard: (row: TData, index: number) => ReactNode;
  /**
   * Array of search inputs, each bound to a different column.
   * Use this for single or multiple search fields.
   */
  searches?: DataTableSearchConfig[];
  /** Number of cards per page (default: 8). */
  pageSize?: number;
  /** Additional classes on the root wrapper. */
  className?: string;
  /** Grid class override. Defaults to a responsive 4-column layout. */
  gridClassName?: string;
  /** Optional custom filters (e.g. status/state) for card mode. */
  filters?: DataTableFilterConfig[];
  /** Optional callbacks for custom pagination actions (e.g. prefetch). */
  paginationOptions?: DataTablePaginationOptions;
}
