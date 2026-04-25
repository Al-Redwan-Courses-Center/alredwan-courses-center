"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TodaysLectureListItem } from "@/types/config";
import { formatTime, toHindiDigits } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import Link from "next/link";

type LectureStatus = TodaysLectureListItem["status"];

const statusMap: Record<
  LectureStatus,
  { label: string; color: "green" | "gray" }
> = {
  completed: { label: "تم التسجيل", color: "green" },
  scheduled: { label: "غير مسجلة", color: "gray" },
  additional: { label: "غير مسجلة", color: "gray" },
  cancelled: { label: "غير مسجلة", color: "gray" },
};

export function renderLectureActions(lecture: TodaysLectureListItem) {
  return (
    <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-center gap-6 *:transition-colors">
      <button>
        <EditIcon />
      </button>

      <Link
        href={`/dashboard/my-courses/${lecture.course.id}/lectures/${lecture.id}`}
      >
        <InfoIcon />
      </Link>
    </div>
  );
}

export const todaysLectureColumns: ColumnDef<TodaysLectureListItem>[] = [
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
    id: "courseName",
    accessorFn: (row) => row.course.name,
    header: "الدورة",
  },

  {
    accessorKey: "start_time",
    header: "البداية",
    cell: ({ row }) => (
      <span className="font-bold">
        {formatTime(row.getValue("start_time"))}
      </span>
    ),
  },

  {
    accessorKey: "end_time",
    header: "النهاية",
    cell: ({ row }) => (
      <span className="font-bold">{formatTime(row.getValue("end_time"))}</span>
    ),
  },

  {
    accessorKey: "status",
    header: "الحالة",
    filterFn: (row, columnId, value: string) => {
      if (!value || value === "all") return true;

      const status = row.getValue(columnId) as LectureStatus;
      const isRegistered = status === "completed";

      return value === "registered" ? isRegistered : !isRegistered;
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as LectureStatus;
      const { label, color } = statusMap[status];
      return <StatusBadge color={color}>{label}</StatusBadge>;
    },
  },

  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const lecture = row.original;

      return renderLectureActions(lecture);
    },
  },
];
