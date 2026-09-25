import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../../lib/utils";

const inputVariants = cva(
  " min-w-0 transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 font-medium placeholder:text-gray-500",
  {
    variants: {
      variant: {
        default:
          "border border-gray-200 bg-white text-gray-800 shadow-sm focus-visible:border-olive-400 focus-visible:ring-[3px] focus-visible:ring-olive-300/40",
        search:
          "border-none bg-transparent text-gray-700 focus-visible:ring-0 shadow-none px-0",
      },
      inputSize: {
        default: "h-12 px-5 text-[1.4rem]",
        large: "h-[50px] px-5 text-[1.5rem]",
      },
      shape: {
        default: "rounded-[10px]",
        square: "rounded-lg",
        leaf: "rounded-tl-[20px] rounded-br-[20px]",
        leafRevert: "rounded-tr-[20px] rounded-bl-[20px]",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
      shape: "default",
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, shape, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(inputVariants({ variant, inputSize, shape, className }))}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input, inputVariants };
