import cn from "@/utils/cn";
import Link from "next/link";

const navLinkStyles = cn(
  "text-primary text-5.6 leading-normal font-normal transition-all hover:font-semibold",
);
const activeStyles = cn("text-shadow-primary font-bold");

export default function NavLink({
  href,
  className = "",
  active = false,
  children,
}: {
  href: string;
  className?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(navLinkStyles, active && activeStyles, className)}
    >
      {children}
    </Link>
  );
}
