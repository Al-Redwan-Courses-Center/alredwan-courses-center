import { cva } from "class-variance-authority";
import clsx from "clsx";
import { ClassNameValue, twMerge } from "tailwind-merge";

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

export function formatTime(dateStr: string | Date | undefined) {
  if (!dateStr) return dateStr;

  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);

  return date
    .toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replaceAll("م", "مـ")
    .replaceAll("ص", "صـ");
}

export function debounceFn(fn: (...args: any[]) => any, delay: number) {
  let timerId: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
