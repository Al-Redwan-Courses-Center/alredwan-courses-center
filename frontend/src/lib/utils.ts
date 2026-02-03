import { cva } from "class-variance-authority";
import clsx from "clsx";
import { parse } from "date-fns";
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

export function formatDate(date: Date) {
  return date.toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(dateStr: string | Date | undefined) {
  if (!dateStr) return dateStr;

  const date =
    dateStr instanceof Date ? dateStr : parse(dateStr, "HH:mm", new Date());

  return date
    .toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replaceAll("م", "مـ")
    .replaceAll("ص", "صـ");
}

const WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export function getWeekDay(num: number) {
  return WEEKDAYS[num];
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

export function getArabicPlural(
  num: number,
  {
    singular,
    twofer,
    plural,
  }: { singular: string; twofer: string; plural: string },
) {
  let pl = singular;

  if (num === 2) pl = twofer;
  if (num >= 3 && num <= 10) pl = plural;

  return pl;
}

export function persistInLocalStorage<T>(
  fn: (value: T | ((prev: T) => T)) => void,
  key: string,
) {
  return function (arg: T | ((prev: T) => T)) {
    console.log(arg);
    if (typeof arg === "function") {
      fn((prev: T) => {
        //eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        const valueToSave = (arg as Function)(prev);

        try {
          localStorage.setItem(key, JSON.stringify(valueToSave));
        } catch (e) {
          console.error("Local Storage Unavailable! ", e);
        }

        return valueToSave;
      });
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(arg));
      } catch (e) {
        console.error("Local Storage Unavailable! ", e);
      }

      fn(arg);
    }
  };
}
