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
        <div className="absolute top-1/2 left-6 flex -translate-y-1/2 items-center justify-center">
          <SearchIcon className="h-[24px] w-[24px] text-stone-400" />
        </div>
      }
      iconAlignment="end"
      placeholder="ابحث عن دورة أو محاضرة..."
      inputStyles={cn(
        "mobile-lg:text-[1.6rem] mobile:text-[2rem] h-[50px] w-full flex-1 rounded-full border border-stone-100 bg-white px-20 pl-14 text-[1.2rem] shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
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
