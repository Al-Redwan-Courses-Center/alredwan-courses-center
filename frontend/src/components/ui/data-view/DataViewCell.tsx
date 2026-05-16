import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function DataViewCellLegacy({
  className = "",
  title = "",
  children = null,
}: {
  className?: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "content-center items-center p-4 has-[.status-badge]:py-0 nth-[1]:text-center nth-[n+4]:flex nth-[n+4]:justify-center",
        className,
      )}
      {...(title ? { title } : {})}
    >
      {children}
    </div>
  );
}
