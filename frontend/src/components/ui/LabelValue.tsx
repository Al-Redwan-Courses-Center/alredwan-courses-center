import { cn } from "@/lib/utils";

interface LabelValueProps {
  label: string;
  value: string | React.ReactNode;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
  variant?: "default" | "large" | "small";
}

function LabelValue({
  label,
  value,
  valueClassName,
  labelClassName,
  className,
  variant = "default",
}: LabelValueProps) {
  const variantStyles = {
    default: {
      label: "font-messiri text-xl leading-4 font-normal text-gray-900",
      value: "text-sm leading-5 font-medium text-gray-900",
    },
    large: {
      label: "font-messiri text-lg leading-4 font-normal text-gray-900",
      value: "text-base leading-5 font-medium text-gray-900",
    },
    small: {
      label: "font-messiri text-base leading-4 font-normal text-gray-900",
      value: "text-xs leading-5 font-medium text-gray-900",
    },
  };

  return (
    <div className={cn("flex items-center justify-start gap-2", className)}>
      <div className="flex items-center justify-start gap-1">
        <span className={cn(variantStyles[variant].label, labelClassName)}>
          {label}
        </span>
        <span className="font-messiri text-xl leading-4 font-medium text-gray-900">
          {" "}
          :{" "}
        </span>
      </div>
      <div className={cn(variantStyles[variant].value, valueClassName)}>
        {value}
      </div>
    </div>
  );
}

export default LabelValue;
