import type { ComponentProps } from "react";

export default function ArrowRight({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      {...props}
    >
      <path
        d="M0.834961 6.66829H12.5016M12.5016 6.66829L6.66829 0.834961M12.5016 6.66829L6.66829 12.5016"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
