"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useSearchData<T>(data: T[], searchableKeys: (keyof T)[]) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  const searchedData = useMemo(() => {
    if (!search) return data;

    return data.filter((item) =>
      searchableKeys.some((key) =>
        String(item[key] || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
  }, [data, search, searchableKeys]);

  return searchedData;
}
