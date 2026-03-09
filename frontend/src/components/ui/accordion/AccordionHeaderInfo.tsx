import { cn } from "@/lib/utils";

interface AccordionHeaderInfoProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
}

export default function AccordionHeaderInfo({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  className,
}: AccordionHeaderInfoProps) {
  return (
    <div className={cn("flex items-center justify-start gap-5", className)}>
      <div
        className={cn(
          "text-xl leading-5 font-medium text-gray-600",
          titleClassName,
        )}
      >
        {title}
      </div>
      {subtitle && (
        <div
          className={cn(
            "text-xs leading-5 font-medium text-gray-600",
            subtitleClassName,
          )}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
