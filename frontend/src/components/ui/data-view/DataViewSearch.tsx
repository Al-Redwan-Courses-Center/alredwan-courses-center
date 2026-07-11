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
      icon={
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <SearchIcon className="text-stone-400 w-[24px] h-[24px]" />
        </div>
      }
      iconAlignment="end"
      placeholder="ابحث عن دورة أو محاضرة..."
      inputStyles={cn(
        "w-full h-[50px] rounded-full bg-white border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[1.2rem] mobile-lg:text-[1.6rem] mobile:text-[2rem] px-20 flex-1 pl-14",
      )}
      wrapperStyles="flex-1 max-w-[400px] w-full relative"
      onChange={(e) => {
        setSearchQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
      value={searchQuery}
    />
  );
}
