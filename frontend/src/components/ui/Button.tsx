import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import Link from "next/link";
import {
  ButtonHTMLAttributes,
  ComponentProps,
  MouseEvent,
  ReactNode,
} from "react";

interface BaseProps {
  className?: string;
  variant?: VariantProps<typeof buttonStyles>["intent"];
  size?: VariantProps<typeof buttonStyles>["size"];
  icon?: ReactNode;
}

export interface LinkProps extends BaseProps, ComponentProps<"a"> {
  href: string;
  onClick?: never;
  type?: never;
}

export interface ButtonProps extends BaseProps, ComponentProps<"button"> {
  href?: never;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
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
        light: cn(
          "shadow-soft rounded-[2rem_0] bg-gray-50 font-semibold text-gray-600 transition-colors hover:bg-gray-100",
        ),
      },

      size: {
        small: cn("px-12 py-4 text-xl"),
        medium: cn("px-13 py-6 text-3xl"),
        wide: cn("w-105 px-10 py-4 text-[1.8rem]"),
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
  type = "button",
  children,
  ...props
}: LinkProps | ButtonProps) {
  if (href)
    return (
      <Link
        href={href}
        className={cn(buttonStyles({ intent: variant, size: size }), className)}
        draggable="false"
        {...(props as Omit<LinkProps, "href">)}
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
      type={type}
      {...(props as ButtonProps)}
    >
      <div className={cn(buttonWrapperStyles, !icon && "justify-center")}>
        {icon}
        {children}
      </div>
    </button>
  );
}
