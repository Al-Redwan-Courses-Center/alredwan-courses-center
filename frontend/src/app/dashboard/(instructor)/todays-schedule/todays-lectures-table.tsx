"use client";

import { DataTable } from "@/shadcn/components/data-table";
import type {
  DataTableFilterConfig,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import { renderLectureActions, todaysLectureColumns } from "./columns";
import { TodaysLectureListItem } from "@/types/config";
import { formatTime, toHindiDigits } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

const statusMap: Record<
  TodaysLectureListItem["status"],
  { label: string; color: "green" | "gray" }
> = {
  completed: { label: "تم التسجيل", color: "green" },
  scheduled: { label: "غير مسجلة", color: "gray" },
  additional: { label: "غير مسجلة", color: "gray" },
  cancelled: { label: "غير مسجلة", color: "gray" },
};

const mobileConfig: DataTableMobileConfig<TodaysLectureListItem> = {
  renderTitle: (row, index) => (
    <span>
      {toHindiDigits(index + 1)}- {row.title}
    </span>
  ),

  renderSubtitle: (row) => (
    <span className="text-olive-400">
      {formatTime(row.start_time)} / {formatTime(row.end_time)}
    </span>
  ),

  renderContent: (row) => {
    const { label, color } = statusMap[row.status];

    return (
      <div className="space-y-3 text-[1.4rem]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">الدورة :</span>
          <span>{row.course.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">البداية :</span>
          <span>{formatTime(row.start_time)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">النهاية :</span>
          <span>{formatTime(row.end_time)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">الحالة :</span>
          <StatusBadge color={color}>{label}</StatusBadge>
        </div>
      </div>
    );
  },

  renderActions: (row) => renderLectureActions(row),
};

const filters: DataTableFilterConfig[] = [
  {
    columnId: "status",
    label: "حالة التسجيل",
    options: [
      { label: "الكل", value: "all" },
      { label: "تم التسجيل", value: "registered" },
      { label: "غير مسجلة", value: "not_registered" },
    ],
  },
];

export default function TodaysLecturesTable({
  todaysLectures = [],
}: {
  todaysLectures?: TodaysLectureListItem[];
}) {
  return (
    <>
      <DataTable
        columns={todaysLectureColumns}
        data={todaysLectures}
        searchKey="title"
        searchPlaceholder="ابحث عن محاضرة..."
        mobileConfig={mobileConfig}
        filters={filters}
        showColumnVisibilityToggle
        pageSize={7}
      />
    </>
  );
}
