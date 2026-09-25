import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function CollapsibleNavLinks({
  trigger,
  children,
  isExpanded,
}: {
  trigger: ReactNode;
  children: ReactNode;
  isExpanded: boolean;
}) {
  return (
    <div className={cn("rounded-2xl", isExpanded && "bg-[#CDD3CC]")}>
      {trigger}

      {isExpanded && (
        <ul className="flex flex-col items-start gap-3 py-5 ps-13">
          {children}
        </ul>
      )}
    </div>
  );
}
