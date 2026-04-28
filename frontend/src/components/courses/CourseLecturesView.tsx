"use client";

import courseLecturesViewConfig from "@/components/courses/course-lectures-view.config";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  cn,
  formatDate,
  formatTime,
  getWeekDay,
  toHindiDigits,
} from "@/lib/utils";
import {
  DataTable,
  DataTableFilterConfig,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import { CourseDetail, LectureListItem } from "@/types/entities";
import { ColumnDef } from "@tanstack/react-table";
import { parseISO } from "date-fns";
import { Check } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const { statusMap } = courseLecturesViewConfig;

export default function CourseLecturesView({
  lectures,
  course,
}: {
  lectures: LectureListItem[];
  course: CourseDetail | null;
}) {
  const columns = useMemo<ColumnDef<LectureListItem>[]>(
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
        accessorKey: "scheduled_at",
        header: "التاريخ",
        cell: ({ row }) => (
          <span>{formatDate(parseISO(row.original.scheduled_at))}</span>
        ),
      },
      {
        id: "weekday",
        header: "اليوم",
        accessorFn: (row) => getWeekDay(parseISO(row.scheduled_at).getDay()),
        cell: ({ row }) => (
          <span className="font-bold">{row.getValue("weekday") as string}</span>
        ),
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
          if (value === "completed")
            return row.getValue(columnId) === "completed";
          return row.getValue(columnId) === "scheduled";
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-center gap-6 *:transition-colors">
            <button>
              <TrashIcon />
            </button>

            <Link href={`/dashboard/my-courses/${course?.id}/lectures/`}>
              <EditIcon />
            </Link>

            <Link
              href={`/dashboard/my-courses/${course?.id}/lectures/${row.original.id}`}
            >
              <InfoIcon />
            </Link>
          </div>
        ),
      },
    ],
    [course?.id],
  );

  const filters = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        columnId: "status",
        label: "اختيار حسب",
        options: [
          { label: "الكل", value: "all" },
          { label: "مسجلة", value: "completed" },
          { label: "غير مسجلة", value: "scheduled" },
        ],
      },
    ],
    [],
  );

  const mobileConfig = useMemo<DataTableMobileConfig<LectureListItem>>(
    () => ({
      renderTitle: (lecture, index) => (
        <span className="truncate">
          {toHindiDigits(index + 1)}- {lecture.title}
        </span>
      ),
      renderSubtitle: (lecture) => <span>{lecture.day}</span>,
      getContentItems: (lecture) => [
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
          key: "scheduled_at",
          label: "التاريخ",
          value: formatDate(parseISO(lecture.scheduled_at)),
        },
        {
          key: "attendance_taken",
          label: "الحضور",
          value: (
            <>
              <span
                className={cn(
                  "flex size-[2.2rem] items-center justify-center rounded-tl-[10px] rounded-br-[10px]",
                  lecture.attendance_taken ? "bg-olive-300" : "bg-gray-200",
                )}
              >
                {lecture.attendance_taken && (
                  <Check className="size-[1.4rem] text-white" />
                )}
              </span>
              <span>{lecture.attendance_taken ? "تم" : "غير مسجل"}</span>
            </>
          ),
        },
        {
          key: "day",
          label: "الأيام",
          value:
            lecture.day || getWeekDay(parseISO(lecture.scheduled_at).getDay()),
        },
      ],
      renderActions: (lecture) => (
        <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-end gap-6 *:transition-colors">
          <button>
            <TrashIcon />
          </button>

          <Link href={`/dashboard/my-courses/${course?.id}/lectures/`}>
            <EditIcon />
          </Link>

          <Link
            href={`/dashboard/my-courses/${course?.id}/lectures/${lecture.id}`}
          >
            <InfoIcon />
          </Link>
        </div>
      ),
    }),
    [course?.id],
  );

  return (
    <DataTable
      columns={columns}
      data={lectures}
      searches={[{ searchKey: "title", placeholder: "ابحث عن دورة أو محاضرة" }]}
      filters={filters}
      mobileConfig={mobileConfig}
      pageSize={5}
      showMobileSortDropdown
    />
  );
}
