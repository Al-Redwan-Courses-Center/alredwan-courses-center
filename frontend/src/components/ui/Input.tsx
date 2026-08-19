"use client";

import type { VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useState,
} from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn, cva } from "@/lib/utils";

const containerStyles = cva(
  cn(
    "shadow-soft bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600 relative",
  ),
  {
    variants: {
      shape: {
        square: cn("rounded-lg pe-5"),
        leafRevert: cn("rounded-[0_2rem]"),
        leaf: cn("rounded-[2rem_0]"),
      },
    },
  },
);

interface BaseInput {
  shape?: VariantProps<typeof containerStyles>["shape"];
  id: string;
  icon?: ReactNode;
  iconAlignment?: "start" | "end";
  placeholder?: string;
  button?: ReactNode;
  inputStyles?: string;
  wrapperStyles?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  unstyled?: boolean;
}

interface UncontrolledInput extends BaseInput {
  onChange: ((e: ChangeEvent<HTMLInputElement>) => void) | null;
  value: string;
  registerReturn?: never;
}

interface ControlledInput extends BaseInput {
  onChange?: never;
  value?: never;
  registerReturn: UseFormRegisterReturn;
}

export default function Input({
  shape = "leaf",
  id,
  icon = null,
  iconAlignment = "start",
  button = null,
  placeholder = "",
  inputStyles,
  wrapperStyles,
  type = "text",
  onChange = null,
  value,
  registerReturn,
  unstyled = false,
}: UncontrolledInput | ControlledInput) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div
      className={cn(
        "[&_svg]:text-olive-300 flex items-center gap-6",
        wrapperStyles,
        !unstyled && icon && containerStyles({ shape }),
        isPassword && !unstyled && !icon && "relative",
      )}
    >
      {iconAlignment === "start" && icon}
      <input
        id={id}
        onChange={(e) => onChange?.(e)}
        value={value}
        {...registerReturn}
        placeholder={placeholder}
        className={cn(
          !unstyled && !icon && containerStyles({ shape }),
          "focus:outline-none w-full",
          isPassword && "pe-14",
          inputStyles,
        )}
        type={isPassword && showPassword ? "text" : type}
      />
      {iconAlignment === "end" && icon}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center"
          aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      )}
      {button}
    </div>
  );
}
