"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { DataViewFilterConfig } from "@/types/components";

export function useFilterData<T>(
  data: T[],
  filterConfig: DataViewFilterConfig,
) {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const filteredData = useMemo(() => {
    const filters = filterParam?.split(",") || [];

    let filtered = data;

    filters.forEach((filter) => {
      const filterOption = filterConfig[filter];

      filtered = filtered.filter(
        (item: T) => (item as Record<string, any>)[filterOption.key] === filter,
      );
    });

    return filtered;
  }, [data, filterConfig, filterParam]);

  return filteredData;
}
