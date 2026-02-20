"use client";

import CheckMarkIcon from "@/components/icons/CheckMarkIcon";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <div>
      <label
        htmlFor={id}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "grid aspect-square h-auto w-15 cursor-pointer place-items-center rounded-[1rem_0] bg-gray-200 text-gray-100",
          checked && "bg-olive-300",
          disabled && "bg-gray-450 pointer-events-none",
          className,
        )}
      >
        {checked && <CheckMarkIcon />}
      </label>
      <input type="checkbox" id={id} hidden checked={checked} readOnly />
    </div>
  );
}
