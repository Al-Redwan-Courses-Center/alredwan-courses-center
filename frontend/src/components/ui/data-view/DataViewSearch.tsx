"use client";

import { useMemo, useState } from "react";
import SearchIcon from "@/components/icons/SearchIcon";
import Input from "@/components/ui/Input";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn, debounceFn } from "@/lib/utils";

interface DataViewSearchLegacyProps {
  isFocused?: boolean;
  setIsFocused?: (focused: boolean) => void;
}

export default function DataViewSearchLegacy({
  isFocused,
  setIsFocused,
}: DataViewSearchLegacyProps) {
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
    <>
      {/* 1. الظل الخلفي اللطيف (Soft Dark Backdrop) */}
      {isFocused && (
        <div
          onClick={() => setIsFocused?.(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-all duration-300"
        />
      )}

      {/* 2. حقل البحث مع تأثير التوهج والتوسع */}
      <div
        className={cn(
          "relative z-50 transition-all duration-300 ease-out origin-right",
          isFocused ? "max-w-full flex-1" : "max-w-[400px] flex-1",
        )}
      >
        <Input
          id="searchbar"
          unstyled
          onFocus={() => setIsFocused?.(true)}
          icon={
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <SearchIcon
                className={cn(
                  "w-[24px] h-[24px] transition-colors duration-300",
                  isFocused ? "text-olive-600" : "text-stone-400",
                )}
              />
            </div>
          }
          iconAlignment="end"
          placeholder="ابحث عن دورة أو محاضرة..."
          inputStyles={cn(
            "w-full h-[50px] rounded-full bg-white border transition-all duration-300 text-[1.2rem] mobile-lg:text-[1.6rem] mobile:text-[2rem] px-20 flex-1 pl-14",
            isFocused
              ? "border-olive-500 shadow-[0_0_20px_rgba(128,128,0,0.35)] ring-2 ring-olive-400/40"
              : "border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
          )}
          wrapperStyles="w-full relative"
          onChange={(e) => {
            setSearchQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
          value={searchQuery}
        />
      </div>
    </>
  );
}