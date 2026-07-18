"use client";

import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { ChangeEvent, InputHTMLAttributes, ReactNode, useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

interface BaseInput {
  shape?: VariantProps<typeof containerStyles>["shape"];
  fieldsetStyles?: string;
  placeholder?: string;
  button?: ReactNode;
  icon?: ReactNode;
  label?: string;
  inputStyles?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
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

const containerStyles = cva(
  cn(
    "shadow-soft relative bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600",
  ),
  {
    variants: {
      shape: {
        square: cn("rounded-lg"),
        leafRevert: cn("rounded-[0_2rem]"),
        leaf: cn("rounded-[2rem_0]"),
      },
    },
  },
);

export default function FieldSetInput({
  shape = "leaf",
  fieldsetStyles,
  placeholder,
  button,
  label,
  inputStyles,
  type,
  onChange,
  value,
  registerReturn,
}: ControlledInput | UncontrolledInput) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <fieldset
      className={cn(
        containerStyles({ shape }),
        "relative pb-4",
        fieldsetStyles,
      )}
    >
      <legend className="ms-5 px-3 text-2xl font-bold">{label}</legend>
      <input
        onChange={(e) => onChange?.(e)}
        value={value}
        {...registerReturn}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent focus:outline-none",
          inputStyles,
          (button || isPassword) && "pe-14",
        )}
        type={isPassword && showPassword ? "text" : type}
      />
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
      {button && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-[50%]",
            isPassword ? "left-14" : "left-5",
          )}
        >
          {button}
        </div>
      )}
    </fieldset>
  );
}
