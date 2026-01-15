import { ComponentProps } from "react";

export default function ArrowDownHead({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="8"
      viewBox="0 0 17 8"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.188095 0.27282C0.468894 -0.0547789 0.962097 -0.0927177 1.28969 0.188081L8.07293 6.00228L14.8562 0.188081C15.1838 -0.0927177 15.677 -0.0547789 15.9578 0.27282C16.2386 0.600418 16.2006 1.09362 15.873 1.37442L8.58136 7.62442C8.28879 7.87519 7.85707 7.87519 7.5645 7.62442L0.272833 1.37442C-0.0547649 1.09362 -0.0927036 0.600418 0.188095 0.27282Z"
        fill="currentColor"
      />
    </svg>
  );
}
