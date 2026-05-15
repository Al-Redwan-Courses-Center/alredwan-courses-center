import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 py-24 text-center",
        className,
      )}
    >
      <p className="text-olive-700 text-4xl font-bold">{title}</p>
      {description && (
        <p className="text-olive-500 max-w-md text-2xl leading-relaxed font-normal">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5 flex shrink-0 justify-center [&_a]:inline-block [&_button]:inline-block">
          {action}
        </div>
      )}
    </div>
  );
}
