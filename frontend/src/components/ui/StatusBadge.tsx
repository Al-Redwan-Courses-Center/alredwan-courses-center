import Dot from "@/components/icons/Dot";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const badgeStyles = cva(
  cn(
    "grid max-w-50 grow grid-cols-[auto_1fr] items-center rounded-[1.5rem_0] py-4 ps-5 text-center font-bold mix-blend-multiply",
  ),
  {
    variants: {
      color: {
        gray: cn("bg-gray-500/10 text-gray-600"),
        green: cn("bg-green-500/10 text-green-700"),
      },
    },
  },
);

export type StatusColors = VariantProps<typeof badgeStyles>["color"];

export default function StatusBadge({
  color = "gray",
  children,
}: {
  color?: VariantProps<typeof badgeStyles>["color"];
  children: ReactNode;
}) {
  return (
    <div className={cn(badgeStyles({ color }), "status-badge")}>
      <Dot className="h-auto w-3" />
      {children}
    </div>
  );
}
