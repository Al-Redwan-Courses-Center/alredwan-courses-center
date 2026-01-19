"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";

const navLinkStyles = cva("", {
  variants: {
    intent: {
      landing: cn(
        "text-olive-500 grid place-items-center text-[1.4rem] leading-normal font-normal transition-all hover:font-semibold",
      ),

      dashboard: cn(
        "shadow-button-secondary inline-block rounded-2xl px-0 pe-20 text-center font-bold text-gray-600 transition-colors",
      ),
    },

    active: {
      true: "",
      false: "",
    },

    boldWidth: {
      true: cn(
        "after:invisible after:block after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-text)] after:select-none",
      ),
      false: "",
    },

    size: {
      medium: cn("py-6 text-3xl"),
    },
  },

  compoundVariants: [
    {
      intent: "landing",
      active: true,
      class: cn(
        "text-shadow-primary [&_img]:drop-shadow-primary pointer-events-none font-bold",
      ),
    },

    {
      intent: "dashboard",
      active: true,
      class: cn(
        "bg-olive-300 pointer-events-none rounded-2xl pe-10 pr-10 text-gray-100",
      ),
    },
  ],
});

const navLinkWrapperStyles = cn("flex items-center gap-5");

export default function NavLink({
  href,
  className = "",
  variant,
  size,
  icon = null,
  boldWidth = true,
  canActivate = true,
  children,
}: {
  href: string;
  className?: string;
  variant: VariantProps<typeof navLinkStyles>["intent"];
  size?: VariantProps<typeof navLinkStyles>["size"];
  icon?: ReactNode;
  active?: boolean;
  boldWidth?: boolean;
  canActivate?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        navLinkStyles({
          intent: variant,
          boldWidth,
          active: canActivate && pathname === href,
          size,
        }),

        className,
      )}
      {...(boldWidth ? { "data-text": children?.toString() } : {})}
    >
      <div
        className={cn(
          navLinkWrapperStyles,
          !icon && "justify-center",
          "transition-all",
        )}
      >
        {icon}
        {children}
      </div>
    </Link>
  );
}
