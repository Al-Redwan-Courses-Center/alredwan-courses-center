"use client";

import { TableSortConfig } from "@/types/components";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useSortData<T>(data: T[], sortConfig: TableSortConfig<T>) {
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sort-by");

  const [field, direction] = sortBy?.split("-") || [];
  const isAsc = direction === "asc";

  const sortedData = useMemo(() => {
    if (!field || !sortConfig) return data;

    const compareFn = sortConfig[field].sortFn;
    const sorted = [...data].sort((a: T, b: T) => {
      const result = compareFn(a, b);

      return isAsc ? result : -result;
    });

    return sorted;
  }, [data, sortConfig, field, isAsc]);

  return sortedData;
}
