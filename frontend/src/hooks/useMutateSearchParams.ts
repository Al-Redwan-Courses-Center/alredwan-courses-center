"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useMutateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const generateQueryString = useCallback(
    (queryParams: { key: string; val: unknown }[]) => {
      const params = new URLSearchParams(searchParams.toString());

      queryParams.forEach(({ key, val }) => {
        if (val === undefined || val === null || (typeof val === "string" && !val)) {
          params.delete(key);
        } else {
          params.set(key, String(val));
        }
      });

      return params.toString();
    },
    [searchParams],
  );

  const mutateSearchParams = useCallback(
    (
      queryParams: { key: string; val: unknown }[],
      replace: boolean = false,
    ) => {
      const newUrl = `${pathname}?${generateQueryString(queryParams)}`;

      if (replace) router.replace(newUrl);
      else router.push(newUrl);
    },
    [pathname, generateQueryString, router],
  );

  return { mutateSearchParams, searchParams };
}
