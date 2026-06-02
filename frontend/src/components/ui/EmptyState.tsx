import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type HeadingLevel = "h2" | "h3" | "h4";

export default function EmptyState({
  title,
  description,
  action,
  className,
  titleClassName,
  descriptionClassName,
  headingLevel = "h2",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  headingLevel?: HeadingLevel;
}) {
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 py-24 text-center",
        className,
      )}
    >
      <Heading
        className={cn("text-4xl font-bold text-gray-600", titleClassName)}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "max-w-md text-2xl leading-relaxed font-normal text-gray-900",
            descriptionClassName,
          )}
        >
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
