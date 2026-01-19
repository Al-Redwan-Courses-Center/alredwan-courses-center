"use client";

import { TableContext } from "@/components/ui/table/Table";
import { ReactNode, useContext } from "react";

export default function TableBody<T>({
  render,
}: {
  render: (item: T, i: number) => ReactNode;
}) {
  const { data } = useContext(TableContext);

  if (!data.length)
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 pt-80 text-4xl font-bold">
        <span className="text-red-800">لا توجد بيانات!</span>
        <span>حاول تغيير معايير التصفية أو حاول مجدداً في وقت لاحق</span>
      </div>
    );

  return <div className="mb-12 flex flex-col gap-6">{data.map(render)}</div>;
}
