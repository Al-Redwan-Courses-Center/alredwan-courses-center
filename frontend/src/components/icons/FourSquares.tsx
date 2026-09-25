import type { ComponentProps } from "react";

export default function FourSquares({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      {...props}
    >
      <path d="M0 0H5.45415V5.45438H0V0Z" fill="currentColor" />
      <path d="M6.54585 0H12V5.45438H6.54585V0Z" fill="currentColor" />
      <path d="M6.54585 6.54562H12V12H6.54585V6.54562Z" fill="currentColor" />
      <path d="M0 6.54562H5.45415V12H0V6.54562Z" fill="currentColor" />
    </svg>
  );
}
