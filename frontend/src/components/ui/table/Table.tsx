import { useFilterData } from "@/hooks/useFilterData";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { useSearchData } from "@/hooks/useSearchData";
import { useSortData } from "@/hooks/useSortData";
import { TableSortConfig } from "@/types/components";
import { createContext, ReactNode } from "react";

interface TableContext {
  columnSizing: string;
  data: any[];
  page: number;
  numPages: number;
  maxItemsPerPage: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (pageNum: number) => void;
  filterConfig: any;
}

const initialContext: TableContext = {
  columnSizing: "",
  data: [],
  page: 1,
  numPages: 10,
  maxItemsPerPage: 1,
  nextPage: () => {},
  prevPage: () => {},
  setPage: () => {},
  filterConfig: {},
};

export const TableContext = createContext<TableContext>(initialContext);
const MAX_ITEMS_PER_PAGE = 6;

export default function Table<T extends Record<string, any>>({
  gridLayout,
  data,
  sortConfig,
  filterConfig,
  children,
}: {
  gridLayout: string;
  data: T[];
  sortConfig: TableSortConfig<T>;
  filterConfig: any;
  children: ReactNode;
}) {
  const { mutateSearchParams, searchParams } = useMutateSearchParams();
  const searchableKeys = Object.keys(data[1]);

  const filteredData = useFilterData<T>(data, filterConfig);
  const searchedData = useSearchData<T>(filteredData, searchableKeys);
  const sortedData = useSortData<T>(searchedData, sortConfig);

  const page = +(searchParams.get("page") || "1");
  const numPages = Math.ceil(searchedData.length / MAX_ITEMS_PER_PAGE);
  const startIndex = (page - 1) * MAX_ITEMS_PER_PAGE;
  const endIndex = startIndex + MAX_ITEMS_PER_PAGE;

  const nextPage = () => {
    if (page >= numPages) return;

    mutateSearchParams([{ key: "page", val: page + 1 }]);
  };

  const prevPage = () => {
    if (page <= 1) return;

    mutateSearchParams([{ key: "page", val: page - 1 }]);
  };

  const setPage = (pageNum: number) => {
    mutateSearchParams([{ key: "page", val: pageNum }]);
  };

  const value: TableContext = {
    columnSizing: gridLayout,
    data: sortedData.slice(startIndex, endIndex),
    page,
    numPages,
    maxItemsPerPage: MAX_ITEMS_PER_PAGE,
    nextPage,
    prevPage,
    setPage,
    filterConfig,
  };

  return <TableContext value={value}>{children}</TableContext>;
}
