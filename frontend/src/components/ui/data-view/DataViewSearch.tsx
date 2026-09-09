"use client";

import { useMemo, useState } from "react";
import SearchIcon from "@/components/icons/SearchIcon";
import Input from "@/components/ui/Input";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn, debounceFn } from "@/lib/utils";

interface DataViewSearchLegacyProps {
  isFocused?: boolean;
  setIsFocused?: (focused: boolean) => void;
  placeholder?: string;
}

export default function DataViewSearchLegacy({
  isFocused,
  setIsFocused,
  placeholder = "ابحث عن دورة أو محاضرة...",
}: DataViewSearchLegacyProps) {
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const currentSearchParam = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(currentSearchParam);
  const [prevSearchParam, setPrevSearchParam] = useState(currentSearchParam);

  const [internalFocused, setInternalFocused] = useState(false);
  const focused = isFocused !== undefined ? isFocused : internalFocused;
  const setFocused = setIsFocused || setInternalFocused;

  if (prevSearchParam !== currentSearchParam) {
    setPrevSearchParam(currentSearchParam);
    setSearchQuery(currentSearchParam);
  }

  const debouncedSearch = useMemo(
    () =>
      debounceFn(
        (val: string) =>
          mutateSearchParams(
            [
              { key: "search", val },
              { key: "page", val: 1 },
            ],
            true,
          ),
        300,
      ),
    [mutateSearchParams],
  );

  const handleExecuteSearch = (val: string) => {
    mutateSearchParams(
      [
        { key: "search", val },
        { key: "page", val: 1 },
      ],
      true,
    );
  };

  return (
    <form
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleExecuteSearch(searchQuery);
      }}
    >
      <Input
        id="searchbar"
        unstyled
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        icon={
          <button
            type="submit"
            aria-label="البحث"
            onClick={() => handleExecuteSearch(searchQuery)}
            className="absolute top-1/2 left-6 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center p-2 transition-opacity hover:opacity-80"
          >
            <SearchIcon
              className={cn(
                "h-[20px] w-[20px] transition-colors duration-200",
                focused ? "text-olive-600" : "text-stone-400",
              )}
            />
          </button>
        }
        iconAlignment="end"
        placeholder={placeholder}
        inputStyles={cn(
          "h-[48px] w-full rounded-full border border-stone-200 bg-white pr-6 pl-14 text-[1.5rem] text-stone-800 shadow-sm transition-all duration-200 placeholder:text-[1.4rem] placeholder:text-stone-400 focus:outline-none md:text-[1.6rem]",
          focused
            ? "border-olive-500 shadow-md ring-2 ring-olive-400/25"
            : "hover:border-stone-300",
        )}
        wrapperStyles="w-full relative"
        onChange={(e) => {
          setSearchQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        value={searchQuery}
      />
    </form>
  );
}
