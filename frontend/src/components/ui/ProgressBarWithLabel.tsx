import type { ComponentType, SVGProps } from "react";
import { cn, toHindiDigits } from "@/lib/utils";

const progressWrapperStyles = cn("flex items-center gap-4 py-6 ps-6");

export default function ProgressBarWithLabel({
  icon: Icon,
  label,
  progress,
  className,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  progress: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-clip rounded-[1rem_0] bg-gray-100 font-bold shadow-inner",
        progressWrapperStyles,
        className,
      )}
      style={{ "--progress": `${progress}%` } as React.CSSProperties}
    >
      <Icon className="text-olive-300 h-10 w-auto" />
      <span className="text-gray-500">{label}</span>

      <div className="absolute top-1/2 left-6 z-10 grid aspect-square w-auto -translate-y-[50%] place-items-center rounded-[0.5rem_0] bg-gray-50 px-2 shadow-[1px_2px_2.1px_0px_rgba(0,0,0,0.17)]">
        {toHindiDigits(progress)}%
      </div>

      <div
        className={cn("bg-olive-300 absolute inset-0", progressWrapperStyles)}
        style={{
          clipPath: `inset(0 0 0 calc(100% - var(--progress)))`,
        }}
      >
        <Icon className="h-10 w-auto text-white" />
        <span className="text-white">{label}</span>
      </div>
    </div>
  );
}
