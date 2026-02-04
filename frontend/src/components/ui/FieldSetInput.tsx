import { cn, cva } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

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
    "shadow-soft bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600",
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
          "w-full focus:outline-none",
          inputStyles,
          button && "pe-10",
        )}
        type={type}
      />
      <div className="absolute top-1/2 left-5 -translate-y-[50%]">{button}</div>
    </fieldset>
  );
}
