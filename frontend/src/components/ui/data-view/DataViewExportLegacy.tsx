"use client";

import React from "react";
import { cn } from "@/lib/utils";
import ExcelIcon from "@/components/icons/microsoftExcelLogo.svg";
import Image from "next/image";

interface DataViewExportLegacyProps {
  onExport?: () => void;
  className?: string;
}

export default function DataViewExportLegacy({
  onExport,
  className,
}: DataViewExportLegacyProps) {
  return (
    <button
      onClick={onExport}
      className={cn(
        "flex h-[50px] w-[50px] items-center justify-center rounded-12 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-stone-100 transition-all hover:bg-stone-50 active:scale-95 shrink-0",
        className
      )}
      title="تصدير إلى Excel"
    >
      <Image src={ExcelIcon} alt="" className="w-28 h-28" />
    </button>
  );
}
