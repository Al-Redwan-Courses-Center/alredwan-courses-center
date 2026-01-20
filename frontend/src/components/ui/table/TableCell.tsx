import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function TableCell({
  className = "",
  children = null,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "content-center items-center p-9 has-[.status-badge]:py-0 nth-[1]:text-center nth-[n+4]:flex nth-[n+4]:justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
