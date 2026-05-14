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
      unstyled
      icon={<SearchIcon className="text-stone-400 w-18 h-18" />}
      iconAlignment="end"
      placeholder="ابحث عن دورة أو محاضرة..."
      inputStyles={cn("w-full h-[50px] rounded-full bg-white border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[1.2rem] px-20 flex-1")}
      wrapperStyles="flex-1 max-w-[400px]"
      containerStyles="w-full"
      onChange={(e) => {
        setSearchQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
      value={searchQuery}
    />
  );
}
