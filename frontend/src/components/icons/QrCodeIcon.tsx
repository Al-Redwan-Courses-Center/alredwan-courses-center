import { ComponentProps } from "react";

export default function QrCodeIcon({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 10V0H10V4H4V10H0ZM0 40V30H4V36H10V40H0ZM30 40V36H36V30H40V40H30ZM36 10V4H30V0H40V10H36ZM31 31H34V34H31V31ZM31 25H34V28H31V25ZM28 28H31V31H28V28ZM25 31H28V34H25V31ZM22 28H25V31H22V28ZM28 22H31V25H28V22ZM25 25H28V28H25V25ZM22 22H25V25H22V22ZM34 6V18H22V6H34ZM18 22V34H6V22H18ZM18 6V18H6V6H18ZM15 31V25H9V31H15ZM15 15V9H9V15H15ZM31 15V9H25V15H31Z"
        fill="currentColor"
      />
    </svg>
  );
}
