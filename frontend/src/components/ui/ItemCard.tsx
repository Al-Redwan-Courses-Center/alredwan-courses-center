import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function ItemCard({
  cardHeader,
  cardFooter,
  className,
  index,
  children,
}: {
  cardHeader?: ReactNode;
  cardFooter?: ReactNode;
  className?: string;
  index: number;
  children: ReactNode;
}) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={cn(
        "shadow-primary relative flex min-w-111 flex-col overflow-clip bg-[#f5f5f5] text-[1.2rem]",
        isEven ? "rounded-[13.8rem_0]" : "rounded-[0_13.8rem]",
        className,
      )}
    >
      {cardHeader && <div className="relative min-h-50">{cardHeader}</div>}

      <div className="grow px-22 py-10">{children}</div>

      {cardFooter && <div className="w-full px-5 pb-5">{cardFooter}</div>}
    </div>
  );
}
