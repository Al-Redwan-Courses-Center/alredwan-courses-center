import { cn } from "@/lib/utils";
import { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

const containerStyles = cn(
  "shadow-soft rounded-[2rem_0] bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600",
);

interface BaseInput {
  placeholder?: string;

  button?: ReactNode;
  label?: string;
  inputStyles?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
}

interface FieldSetInput extends BaseInput {
  icon?: never;
  fieldsetStyles?: string;
}

interface MinimalInput extends BaseInput {
  icon?: ReactNode;
  fieldsetStyles?: never;
}

interface UncontrolledInput extends BaseInput {
  icon?: ReactNode;
  onChange: ((e: ChangeEvent<HTMLInputElement>) => void) | null;
  value: string;
  registerReturn?: never;
}

interface ControlledInput extends BaseInput {
  icon?: ReactNode;
  onChange?: never;
  value?: never;
  registerReturn: UseFormRegisterReturn;
}

export default function Input({
  label = "",
  icon = null,
  button = null,
  placeholder = "",
  inputStyles = "",
  fieldsetStyles = "",
  type = "text",
  onChange = null,
  value,
  registerReturn,
}: (UncontrolledInput | ControlledInput) & (FieldSetInput | MinimalInput)) {
  if (label)
    return (
      <fieldset
        className={cn(containerStyles, "relative pb-4", fieldsetStyles)}
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
        <div className="absolute top-1/2 left-5 -translate-y-[50%]">
          {button}
        </div>
      </fieldset>
    );

  return (
    <div className={cn("flex items-center gap-6", icon && containerStyles)}>
      {icon}
      <input
        onChange={(e) => onChange?.(e)}
        value={value}
        {...registerReturn}
        placeholder={placeholder}
        className={cn(
          !icon && containerStyles,
          "focus:outline-none",
          inputStyles,
        )}
        type={type}
      />
    </div>
  );
}
