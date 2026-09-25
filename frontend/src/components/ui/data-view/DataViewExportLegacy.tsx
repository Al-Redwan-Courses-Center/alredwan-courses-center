"use client";

import Image from "next/image";
import ExcelIcon from "@/components/icons/microsoftExcelLogo.svg";
import { cn } from "@/lib/utils";

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
        "rounded-12 flex h-[50px] w-[50px] shrink-0 items-center justify-center border border-stone-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:bg-stone-50 active:scale-95",
        className,
      )}
      title="تصدير إلى Excel"
    >
      <Image src={ExcelIcon} alt="" className="h-28 w-28" />
    </button>
  );
}
