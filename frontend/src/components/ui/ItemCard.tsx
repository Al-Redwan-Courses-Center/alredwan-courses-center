import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const itemCardVariants = cva(
  "shadow-soft relative flex min-w-111 group flex-col overflow-clip bg-[#f5f5f5] text-[1.2rem]",
  {
    variants: {
      shape: {
        leaf: "rounded-[0_13.8rem] data-[reverted='true']:rounded-[13.8rem_0]",
        square: "rounded-2xl px-10 py-6",
      },
    },
  },
);

export default function ItemCard({
  shape = "leaf",
  cardHeader,
  cardFooter,
  className,
  index,
  children,
}: {
  shape?: VariantProps<typeof itemCardVariants>["shape"];
  cardHeader?: ReactNode;
  cardFooter?: ReactNode;
  className?: string;
  index: number;
  children: ReactNode;
}) {
  const isEven = index % 2 === 0;

  return (
    <div
      data-reverted={isEven}
      data-shape={shape}
      className={cn(itemCardVariants({ shape }), className)}
    >
      {cardHeader && (
        <div className="relative group-data-[shape=leaf]:min-h-50">
          {cardHeader}
        </div>
      )}

      <div className="grow group-data-[shape=leaf]:px-22 group-data-[shape=leaf]:py-10">
        {children}
      </div>

      {cardFooter && (
        <div className="w-full group-data-[shape=leaf]:px-5 group-data-[shape=leaf]:pb-5">
          {cardFooter}
        </div>
      )}
    </div>
  );
}
