"use client";

import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import lecturesViewConfig from "@/components/dashboard/instructor/lectures-view.config";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import {
  DataTable,
  DataTableFilterConfig,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import { TodaysLectureListItem } from "@/types/config";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";

const { statusMap } = lecturesViewConfig;

export default function TodaysLecturesTable({
  todaysLectures = [],
}: {
  todaysLectures?: TodaysLectureListItem[];
}) {
  const columns = useMemo<ColumnDef<TodaysLectureListItem>[]>(
    () => [
      {
        id: "index",
        header: "م",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-bold">{toHindiDigits(row.index + 1)}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "المحاضرة",
      },
      {
        id: "course_name",
        accessorFn: (row) => row.course.name,
        header: "الدورة",
      },
      {
        accessorKey: "start_time",
        header: "البداية",
        cell: ({ row }) => (
          <span className="font-bold">
            {formatTime(row.original.start_time)}
          </span>
        ),
      },
      {
        accessorKey: "end_time",
        header: "النهاية",
        cell: ({ row }) => (
          <span className="font-bold">{formatTime(row.original.end_time)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const { label, color } = statusMap[row.original.status];
          return <StatusBadge color={color}>{label}</StatusBadge>;
        },
        filterFn: (row, columnId, value: string) => {
          if (!value || value === "all") return true;
          if (value === "submitted")
            return row.getValue(columnId) === "completed";
          return row.getValue(columnId) !== "completed";
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-center gap-6 *:transition-colors">
            <button>
              <EditIcon />
            </button>

            <Link
              href={`/dashboard/my-courses/${row.original.course.id}/lectures/${row.original.id}`}
            >
              <InfoIcon />
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  const filters = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        columnId: "status",
        label: "الحالة",
        options: [
          { label: "الكل", value: "all" },
          { label: "مسجلة", value: "submitted" },
          { label: "غير مسجلة", value: "not-submitted" },
        ],
      },
    ],
    [],
  );

  const mobileConfig = useMemo<DataTableMobileConfig<TodaysLectureListItem>>(
    () => ({
      renderTitle: (lecture, index) => (
        <span>
          {toHindiDigits(index + 1)}- {lecture.title}
        </span>
      ),
      renderSubtitle: (lecture) => (
        <span className="text-olive-400">{lecture.course.name}</span>
      ),
      getContentItems: (lecture) => {
        const { label, color } = statusMap[lecture.status];

        return [
          {
            key: "start_time",
            label: "البداية",
            value: formatTime(lecture.start_time),
          },
          {
            key: "end_time",
            label: "النهاية",
            value: formatTime(lecture.end_time),
          },
          {
            key: "status",
            label: "الحالة",
            value: (
              <StatusBadge className={cn("text-[1.2rem]")} color={color}>
                {label}
              </StatusBadge>
            ),
          },
        ];
      },
      renderActions: (lecture) => (
        <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-end gap-6 *:transition-colors">
          <button>
            <EditIcon />
          </button>
          <Link
            href={`/dashboard/my-courses/${lecture.course.id}/lectures/${lecture.id}`}
          >
            <InfoIcon />
          </Link>
        </div>
      ),
    }),
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={todaysLectures}
      searches={[
        {
          searchKey: "title",
          placeholder: "ابحث عن اسم المحاضرة...",
        },
      ]}
      filters={filters}
      mobileConfig={mobileConfig}
      pageSize={7}
    />
  );
}
