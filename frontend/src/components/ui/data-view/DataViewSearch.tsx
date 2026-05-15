"use client";

import SearchIcon from "@/components/icons/SearchIcon";
import Input from "@/components/ui/Input";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn, debounceFn } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function DataViewSearchLegacy() {
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearch = useMemo(
    () =>
      debounceFn(
        (val: string) => mutateSearchParams([{ key: "search", val }]),
        500,
      ),
    [mutateSearchParams],
  );

  return (
    <Input
      id="searchbar"
      icon={<SearchIcon className="text-olive-300" />}
      placeholder="ابحث عن دورة أو محاضرة"
      wrapperStyles="!px-8 !py-3 [&_input]:text-[1.6rem] [&_input::placeholder]:text-[1.6rem]"
      inputStyles={cn("w-full max-w-2xl min-w-0")}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
      value={searchQuery}
    />
  );
}
