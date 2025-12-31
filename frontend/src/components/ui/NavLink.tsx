"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinkStyles = cn(
  "text-olive-500 grid place-items-center text-[1.4rem] leading-normal font-normal transition-all hover:font-semibold",
);
const activeStyles = cn(
  "text-shadow-primary [&_img]:drop-shadow-primary pointer-events-none font-bold",
);
const boldWidthStyles = cn(
  "after:invisible after:block after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-text)] after:select-none",
);

export default function NavLink({
  href,
  className = "",
  boldWidth = true,
  children,
}: {
  href: string;
  className?: string;
  active?: boolean;
  boldWidth?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        navLinkStyles,
        pathname === href && activeStyles,
        boldWidth && boldWidthStyles,
        className,
      )}
      {...(boldWidth ? { "data-text": children?.toString() } : {})}
    >
      {children}
    </Link>
  );
}
