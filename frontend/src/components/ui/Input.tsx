import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

const containerStyles = cva(
  cn(
    "shadow-soft bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600",
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
}: UncontrolledInput | ControlledInput) {
  return (
    <div
      className={cn(
        "[&_svg]:text-olive-300 flex items-center gap-6",
        wrapperStyles,
        icon && containerStyles({ shape }),
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
          !icon && containerStyles({ shape }),
          "focus:outline-none",
          inputStyles,
        )}
        type={type}
      />
      {iconAlignment === "end" && icon}
      {button}
    </div>
  );
}
