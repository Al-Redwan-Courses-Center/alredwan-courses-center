interface WarningIconProps {
  className?: string;
  width?: string;
  height?: string;
}

export default function WarningIcon({
  className = "",
  width = "2.4rem",
  height = "2.4rem",
}: WarningIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
        fill="currentColor"
      />
    </svg>
  );
}
