import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useSearchData<T>(data: T[], searchableValues: (keyof T)[]) {
  console.log(searchableValues);
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  const searchedData = useMemo(() => {
    if (!search) return data;

    return data.filter((item) =>
      searchableValues.some((value) =>
        String(item[value] || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
  }, [data, search, searchableValues]);

  return { searchedData };
}
