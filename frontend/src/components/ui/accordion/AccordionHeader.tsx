import type { ReactNode } from "react";
import ArrowDownHead from "@/components/icons/ArrowDownHead";
import { cn } from "@/lib/utils";
import AccordionArrow from "./AccordionArrow";

interface AccordionHeaderProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

export default function AccordionHeader({
  isOpen,
  children,
  className,
}: AccordionHeaderProps) {
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      {children}
      <div className="flex items-center gap-5">
        <AccordionArrow isOpen={isOpen} />
        <ArrowDownHead className="text-olive-400 h-5 w-5" />
      </div>
    </div>
  );
}
