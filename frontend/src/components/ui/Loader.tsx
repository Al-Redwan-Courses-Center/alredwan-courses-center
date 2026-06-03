import { CSSProperties } from "react";

export default function Loader({ thickness = "0.3em" }: { thickness?: string }) {
  const style = { borderWidth: thickness } as CSSProperties;

  return (
    <div className="grid aspect-square h-full w-auto animate-[spin_3s_linear_infinite]">
      <div
        style={style}
        className="border-t-olive-500 border-r-olive-500 col-start-1 row-start-1 animate-spin rounded-full border-solid border-b-transparent border-l-transparent mix-blend-darken"
      />

      <div
        style={style}
        className="col-start-1 row-start-1 animate-[spin_1s_linear_infinite_reverse] rounded-full border-solid border-t-transparent border-r-transparent border-b-[#dbdcef] border-l-[#dbdcef] mix-blend-darken"
      />
    </div>
  );
}
