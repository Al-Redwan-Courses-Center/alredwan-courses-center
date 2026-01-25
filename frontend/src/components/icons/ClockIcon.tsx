export default function ClockIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M25 0C11.25 0 0 11.25 0 25C0 38.75 11.25 50 25 50C38.75 50 50 38.75 50 25C50 11.25 38.75 0 25 0ZM35.75 33L22.5 25.75V12.5H26.25V23.5L37.5 29.75L35.75 33Z"
        fill="currentColor"
      />
    </svg>
  );
}
