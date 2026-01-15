import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import Link from "next/link";
import { ComponentProps, MouseEvent, ReactNode } from "react";

interface BaseProps {
  className?: string;
  variant?: VariantProps<typeof buttonStyles>["intent"];
  size?: VariantProps<typeof buttonStyles>["size"];
  icon?: ReactNode;
}

interface LinkProps extends BaseProps, ComponentProps<"a"> {
  href: string;
  onClick?: never;
}

interface ButtonProps extends BaseProps, ComponentProps<"button"> {
  href?: never;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const buttonStyles = cva(
  "shadow-button-secondary inline-block text-center font-bold transition-colors",
  {
    variants: {
      intent: {
        primary: cn(
          "bg-olive-500 shadow-primary hover:bg-olive-400 rounded-[0_1.8rem] text-gray-100",
        ),
        secondary: cn(
          "shadow-primary text-olive-500 rounded-[1.8rem_0] bg-gray-100 hover:bg-gray-300",
        ),
      },

      size: {
        small: cn("px-12 py-4 text-xl"),
        medium: cn("px-13 py-6 text-3xl"),
      },
    },

    defaultVariants: {
      intent: "primary",
      size: "medium",
    },
  },
);

const buttonWrapperStyles = cn("flex items-center gap-5");

export default function Button({
  href,
  onClick,
  variant,
  size,
  className,
  icon = null,
  children,
}: LinkProps | ButtonProps) {
  if (href)
    return (
      <Link
        href={href}
        className={cn(buttonStyles({ intent: variant, size: size }), className)}
        draggable="false"
      >
        <div className={cn(buttonWrapperStyles, !icon && "justify-center")}>
          {icon}
          {children}
        </div>
      </Link>
    );

  return (
    <button
      onClick={onClick}
      className={cn(buttonStyles({ intent: variant, size: size }), className)}
      draggable="false"
    >
      <div className={cn(buttonWrapperStyles, !icon && "justify-center")}>
        {icon}
        {children}
      </div>
    </button>
  );
}
