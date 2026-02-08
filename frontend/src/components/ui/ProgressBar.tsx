import { cn } from "@/lib/utils";

export default function ProgressBar({
  className,
  progress,
}: {
  className?: string;
  progress: number;
}) {
  return (
    <div className={cn("relative h-10 w-full", className)}>
      <div
        className="bg-olive-300 absolute h-full rounded-full"
        style={{
          width: `${progress}%`,
        }}
      ></div>

      <div className="bg-olive-100 h-full rounded-full"></div>
    </div>
  );
}
