import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import Dot from "@/components/icons/Dot";
import { cn } from "@/lib/utils";

const badgeStyles = cva(
  "grid max-w-50 grow grid-cols-[auto_1fr] items-center gap-3 rounded-[1.5rem_0] py-4 ps-5 text-center font-bold mix-blend-multiply",
  {
    variants: {
      color: {
        gray: "bg-gray-500/10 text-gray-600",
        green: "bg-green-500/10 text-green-700",
      },
    },
  },
);

export type StatusColors = VariantProps<typeof badgeStyles>["color"];

export default function StatusBadge({
  color = "gray",
  className,
  children,
}: {
  color?: VariantProps<typeof badgeStyles>["color"];
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(badgeStyles({ color }), "status-badge", className)}>
      <Dot className="h-auto w-3" />
      {children}
    </div>
  );
}
