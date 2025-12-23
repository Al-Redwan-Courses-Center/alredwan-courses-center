export default function SecitonDivider({
  startColor,
  endColor,
}: {
  startColor: string;
  endColor: string;
}) {
  return (
    <svg
      width="1123"
      height="280"
      viewBox="0 0 1123 279.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute right-0 bottom-0"
    >
      <g filter="url(#filter0_d_4090_4240)">
        <path
          d="M1190.49 279.65C1189.45 186.532 1103.06 103.952 968.664 69.8398C824.915 33.3513 683.251 66.7849 663.22 71.7176C635.01 78.6704 612.933 86.5211 593.876 95.182C515.587 130.767 463.253 168.559 450.882 177.893C402.078 214.721 297.438 256.722 53 280.192C432.165 280.012 811.33 279.825 1190.49 279.645V279.65Z"
          fill="url(#paint0_linear_4090_4240)"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_4090_4240"
          x="0"
          y="0"
          width="1257.49"
          height="347.192"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="7" dy="7" />
          <feGaussianBlur stdDeviation="30" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_4090_4240"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_4090_4240"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear_4090_4240"
          x1="634.15"
          y1="280.65"
          x2="639.65"
          y2="-486.85"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
      </defs>
    </svg>
  );
}
