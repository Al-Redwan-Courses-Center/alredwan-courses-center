"use client";

import { DataViewFilterConfig } from "@/types/components";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useFilterData<T>(
  data: T[],
  filterConfig: DataViewFilterConfig,
) {
  const searchParams = useSearchParams();

  const filteredData = useMemo(() => {
    const filters = searchParams.get("filter")?.split(",") || [];

    let filtered = data;

    filters.forEach((filter) => {
      const filterOption = filterConfig[filter];

      filtered = filtered.filter(
        (item: T) => (item as Record<string, any>)[filterOption.key] === filter,
      );
    });

    return filtered;
  }, [data, filterConfig, searchParams]);

  return filteredData;
}
