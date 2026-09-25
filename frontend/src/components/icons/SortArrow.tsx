import type { ComponentProps } from "react";

export default function SortArrow({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      {...props}
    >
      <path
        d="M5.91667 1.25V11.75M5.91667 11.75L10.5833 6.5M5.91667 11.75L1.25 6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
