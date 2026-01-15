"use client";

import { TableContext } from "@/components/ui/table/Table";
import { ReactNode, useContext } from "react";

export default function TableBody<T>({
  render,
}: {
  render: (item: T, i: number) => ReactNode;
}) {
  const { data } = useContext(TableContext);

  return <div className="mb-12 flex flex-col gap-6">{data.map(render)}</div>;
}
