"use client";

import CheckMarkIcon from "@/components/icons/CheckMarkIcon";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export default function Checkbox({
  id,
  checked,
  onCheckedChange,
}: CheckboxProps) {
  return (
    <div>
      <label
        htmlFor={id}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "grid aspect-square h-auto w-15 cursor-pointer place-items-center rounded-[1rem_0] bg-[#D9D9D9] text-gray-100",
          checked && "bg-olive-300",
        )}
      >
        {checked && <CheckMarkIcon />}
      </label>
      <input type="checkbox" id={id} hidden checked={checked} readOnly />
    </div>
  );
}
