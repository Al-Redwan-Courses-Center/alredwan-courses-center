"use client";

import InfoIcon from "@/components/icons/InfoIcon";
import { formatDate, toHindiDigits } from "@/lib/utils";
import {
  DataTable,
  DataTableFilterConfig,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import { CourseDetail } from "@/types/entities";
import { ColumnDef } from "@tanstack/react-table";
import { parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";

function renderCourseAction(course: CourseDetail) {
  return (
    <div className="flex items-center justify-center gap-6">
      <Link
        href={`/dashboard/my-courses/${course.id}/`}
        className="text-olive-300 hover:text-olive-700 transition-colors"
      >
        <InfoIcon />
      </Link>
    </div>
  );
}

export default function StudentMyCoursesView({
  courses,
}: {
  courses: CourseDetail[];
  childId?: string;
  role?: string;
}) {
  const seasonOptions = useMemo(
    () =>
      Array.from(
        new Set(courses.map((course) => course.season.name).filter(Boolean)),
      ),
    [courses],
  );

  const columns = useMemo<ColumnDef<CourseDetail>[]>(
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
        accessorKey: "name",
        header: "الدورة",
      },
      {
        id: "season_name",
        accessorFn: (row) => row.season.name,
        header: "الموسم",
        filterFn: (row, columnId, value: string) => {
          if (!value || value === "all") return true;
          return (row.getValue(columnId) as string) === value;
        },
      },
      {
        accessorKey: "start_date",
        header: "البداية",
        cell: ({ row }) => (
          <span>{formatDate(parseISO(row.original.start_date))}</span>
        ),
      },
      {
        accessorKey: "end_date",
        header: "النهاية",
        cell: ({ row }) => {
          const endDate = row.original.end_date;
          return (
            <span>{endDate ? formatDate(parseISO(endDate)) : "غير محدد"}</span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => renderCourseAction(row.original),
      },
    ],
    [],
  );

  const filters = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        columnId: "season_name",
        label: "الموسم",
        options: [
          { label: "الكل", value: "all" },
          ...seasonOptions.map((season) => ({ label: season, value: season })),
        ],
      },
    ],
    [seasonOptions],
  );

  const mobileConfig = useMemo<DataTableMobileConfig<CourseDetail>>(
    () => ({
      renderTitle: (course, index) => (
        <span>
          {toHindiDigits(index + 1)}- {course.name}
        </span>
      ),
      renderSubtitle: (course) => (
        <span className="text-olive-400">{course.season.name}</span>
      ),
      getContentItems: (course) => [
        {
          key: "start_date",
          label: "البداية",
          value: formatDate(parseISO(course.start_date)),
        },
        {
          key: "end_date",
          label: "النهاية",
          value: course.end_date
            ? formatDate(parseISO(course.end_date))
            : "غير محدد",
        },
      ],
      renderActions: (course) => renderCourseAction(course),
    }),
    [],
  );

  return (
    <div className="px-16">
      <DataTable
        columns={columns}
        data={courses}
        searches={[
          {
            searchKey: "name",
            placeholder: "ابحث عن دورة...",
          },
        ]}
        filters={filters}
        mobileConfig={mobileConfig}
        pageSize={8}
      />
    </div>
  );
}
