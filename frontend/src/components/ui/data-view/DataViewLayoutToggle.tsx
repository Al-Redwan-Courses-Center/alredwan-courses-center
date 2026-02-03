"use client";

import FourSquares from "@/components/icons/FourSquares";
import TableIcon from "@/components/icons/TableIcon";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import Toggle from "@/components/ui/Toggle";
import { useContext } from "react";

export default function DataViewLayoutToggle() {
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
