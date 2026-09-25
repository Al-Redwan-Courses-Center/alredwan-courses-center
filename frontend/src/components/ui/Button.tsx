import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  MouseEvent,
  ReactNode,
} from "react";
import Loader from "@/components/ui/Loader";
import { cn, cva } from "@/lib/utils";

interface BaseProps {
  className?: string;
  variant?: VariantProps<typeof buttonStyles>["variant"];
  revert?: boolean;
  size?: VariantProps<typeof buttonStyles>["size"];
  disabled?: boolean;
  icon?: ReactNode;
  loaderThickness?: string;
}

export interface LinkProps extends BaseProps, ComponentProps<"a"> {
  href: string;
  onClick?: never;
  type?: never;
  loading?: never;
}

export interface ButtonProps extends BaseProps, ComponentProps<"button"> {
  href?: never;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  loading?: boolean;
}

export const buttonStyles = cva(
  "shadow-button-secondary inline-block text-center font-bold transition-colors",
  {
    variants: {
      variant: {
        primary:
          "bg-olive-500 shadow-primary hover:bg-olive-400  text-gray-100",

        secondary:
          "shadow-primary text-olive-500  bg-gray-100 hover:bg-gray-300",

        light:
          "shadow-soft rounded-[2rem_0] bg-gray-50 font-semibold text-gray-600 transition-colors hover:bg-gray-100",

        outline:
          "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
      },

      size: {
        small: "px-12 py-4 text-xl",
        medium: "px-13 py-6 text-3xl",
        wide: "w-105 px-10 py-4 text-[1.8rem]",
        large: "px-16 py-6 text-4xl",
      },

      revert: {
        true: "rounded-[0_1.8rem]",
        false: "rounded-[1.8rem_0]",
      },

      loading: {
        true: cn("pointer-events-none bg-gray-300! py-3"),
        false: "",
      },

      disabled: {
        true: cn("bg-gray-450! pointer-events-none text-gray-950"),
      },
    },

    compoundVariants: [
      {
        size: "medium",
        loading: true,
        className: "text-2xl",
      },
    ],

    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);

const buttonWrapperStyles = cn("flex h-full items-center gap-5");

export default function Button({
  href,
  onClick,
  variant,
  size = "medium",
  revert = false,
  loading = false,
  disabled = false,
  className,
  icon = null,
  type = "button",
  loaderThickness,
  children,
  ...props
}: LinkProps | ButtonProps) {
  const calculatedButtonStyles = cn(
    buttonStyles({
      variant,
      size,
      revert,
      loading,
      disabled,
    }),
    className,
  );

  const buttonContent = (
    <>
      {icon}
      {loading ? <Loader thickness={loaderThickness} /> : children}
    </>
  );

  if (href)
    return (
      <Link
        href={href}
        className={cn(calculatedButtonStyles)}
        draggable="false"
        {...(props as Omit<LinkProps, "href">)}
      >
        <div className={cn(buttonWrapperStyles, !icon && "justify-center")}>
          {buttonContent}
        </div>
      </Link>
    );

  return (
    <button
      onClick={onClick}
      className={calculatedButtonStyles}
      draggable="false"
      type={type}
      {...(props as ButtonProps)}
    >
      <div className={cn(buttonWrapperStyles, !icon && "justify-center")}>
        {buttonContent}
      </div>
    </button>
  );
}
