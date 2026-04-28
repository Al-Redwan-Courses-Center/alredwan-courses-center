import * as React from "react";
import { cn } from "../../../lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "search";
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(
        // ── Shared ────────────────────────────────────────────────────────
        "w-full min-w-0 transition-[color,box-shadow] outline-none",
        "placeholder:text-gray-400",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",

        // ── Variant: default (standard Figma form field) ─────────────────
        "data-[variant=default]:h-20 data-[variant=default]:rounded-[10px]",
        "data-[variant=default]:border data-[variant=default]:border-gray-200",
        "data-[variant=default]:bg-white data-[variant=default]:px-5",
        "data-[variant=default]:text-[1.5rem] data-[variant=default]:font-medium data-[variant=default]:text-gray-800",
        "data-[variant=default]:shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]",
        "data-[variant=default]:focus-visible:border-olive-400",
        "data-[variant=default]:focus-visible:ring-olive-300/40 data-[variant=default]:focus-visible:ring-[3px]",
        "data-[variant=default]:aria-invalid:border-red-400 data-[variant=default]:aria-invalid:ring-red-300/30",

        // No border, no bg, no ring — the wrapper card provides those.
        "data-[variant=search]:border-none data-[variant=search]:bg-transparent",
        "data-[variant=search]:text-[1.5rem] data-[variant=search]:font-medium data-[variant=search]:text-gray-700",
        "data-[variant=search]:focus-visible:ring-0",

        className,
      )}
      {...props}
    />
  );
}

export { Input };
