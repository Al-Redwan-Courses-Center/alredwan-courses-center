"use client";

import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { ChangeEvent, InputHTMLAttributes, ReactNode, useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

const containerStyles = cva(
  cn(
    "shadow-soft relative bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600",
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
          "w-full focus:outline-none",
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
          className="absolute top-1/2 left-6 flex -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      )}
      {button}
    </div>
  );
}
