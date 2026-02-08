"use client";

import { useFilterData } from "@/hooks/useFilterData";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { useSearchData } from "@/hooks/useSearchData";
import { useSortData } from "@/hooks/useSortData";
import { DataViewFilterConfig, DataViewSortConfig } from "@/types/components";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

interface DataViewContext<T> {
  columnSizing: string;
  layout: "table" | "cards";
  setLayout: Dispatch<SetStateAction<"table" | "cards">>;
  data: any[];
  page: number;
  numPages: number;
  maxItemsPerPage: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (pageNum: number) => void;
  filterConfig: DataViewFilterConfig;
  sortConfig: DataViewSortConfig<T>;
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

export default function DataView<T extends Record<string, any>>({
  gridLayout,
  data,
  maxItemsPerPage = MAX_ITEMS_PER_PAGE,
  sortConfig,
  filterConfig,
  viewLayout = "table",
  children,
}: {
  gridLayout: string;
  data: T[];
  maxItemsPerPage?: number;
  sortConfig: DataViewSortConfig<T>;
  filterConfig: DataViewFilterConfig;
  viewLayout?: "table" | "cards";
  children: ReactNode;
}) {
  const [layout, setLayout] =
    useState<DataViewContext<T>["layout"]>(viewLayout);
  const { mutateSearchParams, searchParams } = useMutateSearchParams();

  const searchableKeys = !!data.length ? Object.keys(data[0]) : [""];

  const filteredData = useFilterData<T>(data, filterConfig);
  const searchedData = useSearchData<T>(filteredData, searchableKeys);
  const sortedData = useSortData<T>(searchedData, sortConfig);

  const page = +(searchParams.get("page") || "1");
  const numPages = Math.ceil(searchedData.length / maxItemsPerPage);
  const startIndex = (page - 1) * maxItemsPerPage;
  const endIndex = startIndex + maxItemsPerPage;

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

  const value: DataViewContext<T> = {
    columnSizing: gridLayout,
    layout,
    setLayout,
    data: sortedData.slice(startIndex, endIndex),
    page,
    numPages,
    maxItemsPerPage,
    nextPage,
    prevPage,
    setPage,
    filterConfig,
    sortConfig,
  };

  return <DataViewContext value={value}>{children}</DataViewContext>;
}
