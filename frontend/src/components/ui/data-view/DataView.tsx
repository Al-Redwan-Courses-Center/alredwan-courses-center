"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useState,
} from "react";
import { useFilterData } from "@/hooks/useFilterData";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { useSearchData } from "@/hooks/useSearchData";
import { useSortData } from "@/hooks/useSortData";
import type {
  DataViewFilterConfig,
  DataViewSortConfig,
} from "@/types/components";

interface DataViewContext<T> {
  columnSizing: string;
  layout: "table" | "cards";
  setLayout: Dispatch<SetStateAction<"table" | "cards">>;
  data: T[];
  page: number;
  numPages: number;
  maxItemsPerPage: number;
  totalCount?: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (pageNum: number) => void;
  filterConfig: DataViewFilterConfig;
  sortConfig: DataViewSortConfig<T>;
  manualPagination?: boolean;
}

const initialContext: DataViewContext<any> = {
  columnSizing: "",
  layout: "table",
  setLayout: () => {},
  data: [],
  page: 1,
  numPages: 10,
  maxItemsPerPage: 1,
  nextPage: () => {},
  prevPage: () => {},
  setPage: () => {},
  filterConfig: {},
  sortConfig: {},
};

export const DataViewContext =
  createContext<DataViewContext<any>>(initialContext);

const MAX_ITEMS_PER_PAGE = 6;

export default function DataViewLegacy<T extends Record<string, any>>({
  gridLayout,
  data,
  maxItemsPerPage = MAX_ITEMS_PER_PAGE,
  sortConfig,
  filterConfig,
  viewLayout = "table",
  manualPagination,
  totalPages,
  totalCount,
  currentPage,
  children,
}: {
  gridLayout: string;
  data: T[];
  maxItemsPerPage?: number;
  sortConfig: DataViewSortConfig<T>;
  filterConfig: DataViewFilterConfig;
  viewLayout?: "table" | "cards";
  manualPagination?: boolean;
  totalPages?: number;
  totalCount?: number;
  currentPage?: number;
  children: ReactNode;
}) {
  const [layout, setLayout] =
    useState<DataViewContext<T>["layout"]>(viewLayout);
  const maxItemsState = layout === "cards" ? 8 : maxItemsPerPage;

  const { mutateSearchParams, searchParams } = useMutateSearchParams();

  const isRemote =
    manualPagination ?? (totalPages !== undefined || totalCount !== undefined);

  const searchableKeys = data.length ? Object.keys(data[0]) : [""];

  const filteredData = useFilterData<T>(data, isRemote ? {} : filterConfig);
  const searchedData = useSearchData<T>(
    isRemote ? data : filteredData,
    isRemote ? [] : searchableKeys,
  );
  const sortedData = useSortData<T>(
    isRemote ? data : searchedData,
    isRemote ? {} : sortConfig,
  );

  const page = currentPage ?? +(searchParams.get("page") || "1");
  const numPages = isRemote
    ? (totalPages ??
      (totalCount !== undefined
        ? Math.ceil(totalCount / maxItemsState)
        : Math.ceil(data.length / maxItemsState) || 1))
    : Math.ceil(searchedData.length / maxItemsState) || 1;

  const startIndex = (page - 1) * maxItemsState;
  const endIndex = startIndex + maxItemsState;

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

  const displayData = isRemote
    ? data
    : sortedData.slice(startIndex, endIndex);

  const value: DataViewContext<T> = {
    columnSizing: gridLayout,
    layout,
    setLayout,
    data: displayData,
    page,
    numPages,
    maxItemsPerPage: maxItemsState,
    totalCount,
    nextPage,
    prevPage,
    setPage,
    filterConfig,
    sortConfig,
    manualPagination: isRemote,
  };

  return <DataViewContext value={value}>{children}</DataViewContext>;
}
