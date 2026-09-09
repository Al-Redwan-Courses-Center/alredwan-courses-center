"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function normalizeSearchText(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, "") // Remove arabic tashkeel / harakat
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .toLowerCase()
    .trim();
}

function extractSearchableValues(val: unknown): string[] {
  if (val === null || val === undefined) return [];
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return [String(val)];
  }
  if (Array.isArray(val)) {
    return val.flatMap(extractSearchableValues);
  }
  if (typeof val === "object") {
    return Object.values(val).flatMap(extractSearchableValues);
  }
  return [];
}

export function useSearchData<T>(data: T[], searchableKeys: (keyof T)[]) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  const searchableKeysStr = searchableKeys.join(",");

  const searchedData = useMemo(() => {
    if (!search || !search.trim()) return data;

    const normalizedQuery = normalizeSearchText(search);
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return data;

    const keys = searchableKeysStr
      ? (searchableKeysStr.split(",").filter(Boolean) as (keyof T)[])
      : [];

    return data.filter((item) => {
      const targetKeys =
        keys.length > 0 ? keys : (Object.keys(item as object) as (keyof T)[]);

      const values = targetKeys.flatMap((key) =>
        extractSearchableValues(
          (item as Record<string, unknown>)[key as string],
        ),
      );

      const normalizedContent = normalizeSearchText(values.join(" "));

      return queryWords.every((word) => normalizedContent.includes(word));
    });
  }, [data, search, searchableKeysStr]);

  return searchedData;
}
