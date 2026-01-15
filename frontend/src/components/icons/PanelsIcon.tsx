import { ComponentProps } from "react";

export default function PanelsIcon({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M0 8.34783C0 7.77153 0.447715 7.30435 1 7.30435H7C7.55228 7.30435 8 7.77153 8 8.34783V22.9565C8 23.5328 7.55228 24 7 24H3C1.34315 24 0 22.5985 0 20.8696V8.34783Z"
        fill="currentColor"
      />
      <path
        d="M10 8.34783C10 7.77153 10.4477 7.30435 11 7.30435H23C23.5523 7.30435 24 7.77153 24 8.34783V20.8696C24 22.5985 22.6569 24 21 24H11C10.4477 24 10 23.5328 10 22.9565V8.34783Z"
        fill="currentColor"
      />
      <path
        d="M0 3.13043C0 1.40154 1.34315 0 3 0H21C22.6569 0 24 1.40154 24 3.13043V4.17391C24 4.75021 23.5523 5.21739 23 5.21739H1C0.447716 5.21739 0 4.75021 0 4.17391V3.13043Z"
        fill="currentColor"
      />
    </svg>
  );
}
