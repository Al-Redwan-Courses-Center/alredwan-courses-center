"use client";

import { useContext } from "react";
import FourSquares from "@/components/icons/FourSquares";
import TableIcon from "@/components/icons/TableIcon";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import Toggle from "@/components/ui/Toggle";

export default function DataViewLayoutToggleLegacy() {
  const { layout, setLayout } = useContext(DataViewContext);

  return (
    <Toggle
      leftItem={{ icon: <FourSquares />, value: "cards" }}
      rightItem={{ icon: <TableIcon />, value: "table" }}
      state={layout}
      onToggle={setLayout}
      className="absolute top-16 left-171 z-100"
    />
  );
}
