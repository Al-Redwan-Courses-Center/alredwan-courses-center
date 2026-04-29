"use client";

import InfoIcon from "@/components/icons/InfoIcon";
import { formatDate, toHindiDigits } from "@/lib/utils";
import {
  DataCards,
  DataTableFilterConfig,
} from "@/shadcn/components/data-table";
import type { CourseDetail, CourseListItem } from "@/types/entities";
import { ColumnDef } from "@tanstack/react-table";
import { parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import MyCourseCard from "@/components/courses/MyCourseCard";

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

  return (
    <div className="px-16">
      <DataCards
        columns={columns}
        data={courses}
        searches={[
          {
            searchKey: "name",
            placeholder: "ابحث عن دورة...",
          },
        ]}
        filters={filters}
        pageSize={8}
        gridClassName="grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
        renderCard={(course, index) => (
          <MyCourseCard
            course={course as unknown as CourseListItem}
            index={index}
            key={course.id}
          />
        )}
      />
    </div>
  );
}
