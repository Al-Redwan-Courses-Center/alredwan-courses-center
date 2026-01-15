import { cn } from "@/lib/utils";
import { ChangeEvent, ReactNode } from "react";

const containerStyles = cn(
  "shadow-soft rounded-[2rem_0] bg-gray-50 px-10 py-4 [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600",
);

export default function Input({
  label = "",
  icon = null,
  placeholder = "",
  inputStyles = "",
  fieldsetStyles = "",
  onChange = null,
  value = "",
}: {
  placeholder?: string;
  icon?: ReactNode;
  label?: string;
  inputStyles?: string;
  fieldsetStyles?: string;
  onChange?: ((e: ChangeEvent<HTMLInputElement>) => void) | null;
  value?: string;
}) {
  if (label)
    return (
      <fieldset className={cn(containerStyles, "pb-4", fieldsetStyles)}>
        <legend className="ms-5 px-3 text-2xl font-bold">{label}</legend>
        <input
          onChange={(e) => onChange?.(e)}
          value={value}
          placeholder={placeholder}
          className={cn("focus:outline-none", inputStyles)}
        />
      </fieldset>
    );

  return (
    <div className={cn("flex items-center gap-6", icon && containerStyles)}>
      {icon}
      <input
        onChange={(e) => onChange?.(e)}
        value={value}
        placeholder={placeholder}
        className={cn(
          !icon && containerStyles,
          "focus:outline-none",
          inputStyles,
        )}
      />
    </div>
  );
}
