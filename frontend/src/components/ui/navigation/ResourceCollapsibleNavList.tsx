"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import CollapsibleNavLinks from "@/components/ui/navigation/CollapsibleNavList";
import NavLink from "@/components/ui/navigation/NavLink";
import { cn } from "@/lib/utils";

type NestedNavLinks = {
  href: string;
  label: string;
}[];

export default function ResourceCollapsibleNavList({
  rootLabel,
  rootHref,
  rootIcon,
  nestedNavLinks,
}: {
  rootLabel: string;
  rootHref: string;
  rootIcon: ReactNode;
  nestedNavLinks: NestedNavLinks;
}) {
  const pathname = usePathname();
  const id = pathname.replace(rootHref, "").split("/")[1];
  const showNested = pathname !== rootHref && pathname.startsWith(rootHref);

  return (
    <CollapsibleNavLinks
      trigger={
        <NavLink
          variant="dashboard"
          size="medium"
          href={rootHref}
          icon={rootIcon}
          className={cn(showNested && "w-full bg-[#B9C3B8] ps-3")}
        >
          {rootLabel}
        </NavLink>
      }
      isExpanded={showNested}
    >
      {nestedNavLinks.map((navlink, i) => (
        <NavLink
          key={i}
          variant="dashboard"
          size="medium"
          href={`${rootHref}/${id}${navlink.href ? "/" + navlink.href : navlink.href}`}
          boldWidth={false}
          className="ms-0 flex translate-x-0 items-center gap-4 py-4 shadow-none!"
        >
          <span>
            <svg
              width="7"
              height="7"
              viewBox="0 0 7 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="3.5" cy="3.5" r="3.5" fill="currentColor" />
            </svg>
          </span>

          {navlink.label}
        </NavLink>
      ))}
    </CollapsibleNavLinks>
  );
}
