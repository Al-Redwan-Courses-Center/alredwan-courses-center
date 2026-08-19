"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toggleButtonStyles = cn(
  "grid aspect-square h-auto w-[2.6rem] place-items-center rounded-[0.5rem_0] py-3",
);

const toggleSvgStyles = cn(
  "relative z-10 h-full w-auto drop-shadow-[0_1px_2.4px_rgba(0,0,0,0.25)]",
);

interface ToggleItem<T> {
  icon: ReactNode;
  value: T;
}

export default function Toggle<T>({
  state,
  leftItem,
  rightItem,
  onToggle,
  className,
}: {
  state: T;
  leftItem: ToggleItem<T>;
  rightItem: ToggleItem<T>;
  onToggle: (s: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-11 rounded-[1rem_0] bg-gray-100 p-2 text-gray-100 shadow-[0_1px_4.3px_0_rgba(0,0,0,0.25)_inset,0_3px_6.7px_0_rgba(0,0,0,0.07)_inset]",
        className,
      )}
    >
      <button
        className={cn(
          toggleButtonStyles,
          state === rightItem.value && "pointer-events-none relative",
        )}
        onClick={() => onToggle(rightItem.value)}
      >
        {state === "table" && (
          <motion.div
            layoutId="toggleActiveBG"
            className="bg-olive-200 absolute h-full w-full rounded-[0.5rem_0] shadow-[1.318px_1.13px_2.749px_0_rgba(0,0,0,0.25)]"
          ></motion.div>
        )}
        <span className={cn(toggleSvgStyles)}>{rightItem.icon}</span>
      </button>

      <button
        className={cn(
          toggleButtonStyles,
          state === "cards" && "pointer-events-none relative",
        )}
        onClick={() => onToggle(leftItem.value)}
      >
        {state === "cards" && (
          <motion.div
            layoutId="toggleActiveBG"
            className="bg-olive-200 absolute h-full w-full rounded-[0.5rem_0] shadow-[1.318px_1.13px_2.749px_0_rgba(0,0,0,0.25)]"
          ></motion.div>
        )}
        <span className={cn(toggleSvgStyles)}>{leftItem.icon}</span>
      </button>
    </div>
  );
}
