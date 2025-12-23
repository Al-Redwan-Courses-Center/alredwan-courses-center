import cn from "@/utils/cn";
import Link from "next/link";
import { MouseEvent } from "react";

interface BaseProps {
  className?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: React.ReactNode;
}

interface LinkProps extends BaseProps {
  href: string;
  onClick?: never;
}

interface ButtonProps extends BaseProps {
  href?: never;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

const baseStyles = cn(
  "shadow-button-secondary inline-block text-center font-bold transition-colors",
);

const variants = {
  none: cn(""),
  primary: cn(
    "bg-olive-500 shadow-primary hover:bg-olive-400 rounded-[0_1.8rem] text-gray-100",
  ),
  secondary: cn(
    "shadow-primary text-olive-500 rounded-[1.8rem_0] bg-gray-100 hover:bg-gray-300",
  ),
};

const sizes = {
  sm: cn("px-12 py-4 text-xl"),
  m: cn("px-13 py-6 text-3xl"),
};

export default function Button({
  href,
  onClick,
  variant = "none",
  size = "m",
  className,
  children,
}: LinkProps | ButtonProps) {
  if (href)
    return (
      <Link
        href={href}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        draggable="false"
      >
        {children}
      </Link>
    );

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      draggable="false"
    >
      {children}
    </button>
  );
}
