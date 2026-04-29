import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "./input";
import { cn } from "@/lib/utils"; // تأكد من مسار الـ utils

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        dir="rtl"
        className={cn(
          "flex h-[50px] w-full min-w-0 items-center gap-[16px] py-[11px] ps-4 pe-[24px]",
          "rounded-tl-[20px] rounded-br-[20px] bg-[#EAEDEA] transition-all",
          "focus-within:ring-olive-300/40 cursor-text focus-within:ring-[3px]",
          containerClassName,
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-[#8E9B85]" />

        <Input
          id={id}
          ref={ref}
          variant="search"
          className={cn("w-full flex-1 px-0", className)}
          {...props}
        />
      </label>
    );
  },
);

SearchInput.displayName = "SearchInput";
