/* ======================= 
   Accordion Item with smooth border-radius transition
======================= */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAccordionContext } from "./Accordion";

interface AccordionItemProps {
  id: string;
  header: React.ReactNode | ((isOpen: boolean) => React.ReactNode);
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  rounded?: "top-left" | "top-left-bottom-right" | "all";
  shadow?: boolean;
}

function AccordionItem({
  id,
  header,
  children,
  className,
  headerClassName,
  contentClassName,
  rounded = "top-left-bottom-right",
  shadow = false,
}: AccordionItemProps) {
  const { openIds, toggleItem } = useAccordionContext();
  const isOpen = openIds.has(id);
  const baseRoundedClasses = {
    "top-left": "rounded-tl-[20px]",
    "top-left-bottom-right": "rounded-tl-[20px] rounded-br-[20px]",
    all: "rounded-[20px]",
  };

  const headerRounded = (() => {
    if (!children) return baseRoundedClasses[rounded];
    if (isOpen) {
      if (rounded === "all") return "rounded-t-[20px] rounded-l-[20px]";
      if (rounded === "top-left-bottom-right") return "rounded-tl-[20px]";
      return baseRoundedClasses[rounded];
    } else {
      return baseRoundedClasses[rounded];
    }
  })();

  return (
    <article className={cn("flex flex-col", className)} dir="rtl">
      <button
        type="button"
        onClick={() => toggleItem(id)}
        aria-expanded={isOpen}
        className={cn(
          "bg-olive-100 inline-flex h-12 w-full items-center justify-between px-6 transition-all duration-300 ease-in-out",
          headerRounded,
          shadow && "shadow-soft",
          headerClassName,
        )}
      >
        {typeof header === "function" ? header(isOpen) : header}
      </button>

      {children && (
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div
            className={cn(
              "overflow-hidden bg-gray-100 p-5 transition-all duration-300 ease-in-out",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      )}
    </article>
  );
}

export default AccordionItem;
