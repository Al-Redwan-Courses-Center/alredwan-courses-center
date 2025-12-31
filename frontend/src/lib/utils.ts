import clsx from "clsx";
import { ClassNameValue, twMerge } from "tailwind-merge";
import { cva } from "class-variance-authority";

export function cn(...inputs: ClassNameValue[]) {
  return twMerge(clsx(inputs));
}

export { cva };

export function toHindiDigits(num: number | string): string {
  const westernToHindi: Record<string, string> = {
    "0": "٠",
    "1": "١",
    "2": "٢",
    "3": "٣",
    "4": "٤",
    "5": "٥",
    "6": "٦",
    "7": "٧",
    "8": "٨",
    "9": "٩",
  };

  return num
    .toString()
    .replace(/[0-9]/g, (digit) => westernToHindi[digit] || digit);
}
