"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useSearchData<T>(data: T[], searchableKeys: (keyof T)[]) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  const searchableKeysStr = searchableKeys.join(",");

  const searchedData = useMemo(() => {
    if (!search) return data;

    const keys = searchableKeysStr.split(",") as (keyof T)[];

    return data.filter((item) =>
      keys.some((key) =>
        String(item[key] || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
  }, [data, search, searchableKeysStr]);

  return searchedData;
}
