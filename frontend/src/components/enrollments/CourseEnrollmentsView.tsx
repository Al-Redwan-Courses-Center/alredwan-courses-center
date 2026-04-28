"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import {
  DataTable,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import { InstructorEnrollmentListItem } from "@/types/entities";
import { ColumnDef } from "@tanstack/react-table";
import { parseISO } from "date-fns";
import { useMemo } from "react";

const participantTranslationMap: Record<
  NonNullable<InstructorEnrollmentListItem["participant_type"]>,
  string
> = {
  child: "طفل",
  student: "طالب",
};

const enrollmentStatusMap: Record<
  InstructorEnrollmentListItem["status"],
  { label: string; color: string }
> = {
  active: {
    label: "نشط",
    color: cn("bg-green-300"),
  },
  completed: {
    label: "نشط",
    color: cn("bg-blue-300"),
  },
  dropped: {
    label: "نشط",
    color: cn("bg-gray-300"),
  },
  refunded: {
    label: "نشط",
    color: cn("bg-purple-300"),
  },
  suspended: {
    label: "نشط",
    color: cn("bg-amber-300"),
  },
};

export default function CourseEnrollmentsView({
  enrollments,
}: {
  enrollments: InstructorEnrollmentListItem[];
}) {
  const columns = useMemo<ColumnDef<InstructorEnrollmentListItem>[]>(
    () => [
      {
        id: "index",
        header: "م",
        enableSorting: false,
        cell: ({ row }) => <span>{toHindiDigits(row.index + 1)}</span>,
      },
      {
        accessorKey: "course_name",
        header: "الدورة",
      },
      {
        accessorKey: "participant_name",
        header: "الطالب",
      },
      {
        accessorKey: "participant_type",
        header: "نوع الطالب",
        cell: ({ row }) => (
          <span>
            {row.original.participant_type
              ? participantTranslationMap[row.original.participant_type]
              : "غير محدد"}
          </span>
        ),
      },
      {
        accessorKey: "participant_phone",
        header: "رقم الهاتف",
        cell: ({ row }) => (
          <span>
            {row.original.participant_phone
              ? toHindiDigits(row.original.participant_phone.slice(2), true)
              : "غير معرف"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const { color: statusColor, label: statusLabel } =
            enrollmentStatusMap[row.original.status];

          return (
            <StatusBadge className={statusColor}>{statusLabel}</StatusBadge>
          );
        },
      },
      {
        accessorKey: "enrolled_at",
        header: "وقت الالتحاق",
        cell: ({ row }) => (
          <span>{formatDate(parseISO(row.original.enrolled_at))}</span>
        ),
      },
    ],
    [],
  );

  const mobileConfig = useMemo<
    DataTableMobileConfig<InstructorEnrollmentListItem>
  >(
    () => ({
      renderTitle: (enrollment, index) => (
        <span>
          {toHindiDigits(index + 1)}- {enrollment.participant_name}
        </span>
      ),
      renderSubtitle: (enrollment) => (
        <span className="text-olive-400">{enrollment.course_name}</span>
      ),
      getContentItems: (enrollment) => {
        const { color: statusColor, label: statusLabel } =
          enrollmentStatusMap[enrollment.status];

        return [
          {
            key: "participant_type",
            label: "نوع الطالب",
            value: enrollment.participant_type
              ? participantTranslationMap[enrollment.participant_type]
              : "غير محدد",
          },
          {
            key: "participant_phone",
            label: "رقم الهاتف",
            value: enrollment.participant_phone
              ? toHindiDigits(enrollment.participant_phone.slice(2), true)
              : "غير معرف",
          },
          {
            key: "status",
            label: "الحالة",
            value: (
              <StatusBadge className={statusColor}>{statusLabel}</StatusBadge>
            ),
          },
          {
            key: "enrolled_at",
            label: "وقت الالتحاق",
            value: formatDate(parseISO(enrollment.enrolled_at)),
          },
        ];
      },
    }),
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={enrollments}
      searches={[
        {
          searchKey: "participant_name",
          placeholder: "ابحث عن طالب...",
        },
      ]}
      mobileConfig={mobileConfig}
      pageSize={5}
    />
  );
}
