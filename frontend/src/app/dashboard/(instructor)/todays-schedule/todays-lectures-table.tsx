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

  getContentItems: (row) => {
    const { label, color } = statusMap[row.status];

    return [
      {
        key: "course_name",
        label: "الدورة",
        value: row.course.name,
      },
      {
        key: "start_time",
        label: "البداية",
        value: formatTime(row.start_time),
      },
      {
        key: "end_time",
        label: "النهاية",
        value: formatTime(row.end_time),
      },
      {
        key: "status",
        label: "الحالة",
        value: <StatusBadge color={color}>{label}</StatusBadge>,
      },
    ];
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
        searches={[
          {
            searchKey: "title",
            placeholder: "ابحث عن اسم المحاضرة...",
          },
        ]}
        mobileConfig={mobileConfig}
        filters={filters}
        showColumnVisibilityToggle
        pageSize={5}
      />
    </>
  );
}
