interface ArrowBackIconProps {
  className?: string;
  width?: string;
  height?: string;
}

export default function ArrowBackIcon({
  className = "",
  width = "2.4rem",
  height = "2.4rem",
}: ArrowBackIconProps) {
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
        d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"
        fill="currentColor"
      />
    </svg>
  );
}
