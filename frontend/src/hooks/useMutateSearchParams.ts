import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useMutateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const generateQueryString = useCallback(
    (key: string, val: any) => {
      const params = new URLSearchParams(searchParams.toString());

      if (typeof val === "string" && !val) {
        params.delete(key);
      } else {
        params.set(key, val);
      }

      return params.toString();
    },
    [searchParams],
  );

  function mutateSearchParams(key: string, val: any) {
    router.push(`${pathname}?${generateQueryString(key, val)}`);
  }

  return { mutateSearchParams, searchParams };
}
