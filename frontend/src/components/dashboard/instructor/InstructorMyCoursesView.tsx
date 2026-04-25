"use client";

import MyCourseCard from "@/components/courses/MyCourseCard";
import InfoIcon from "@/components/icons/InfoIcon";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import buildInstructorMyCoursesConfig, {
  CourseViewItem,
} from "@/components/dashboard/instructor/instructor-my-courses-view-config";
import { parseISO } from "date-fns";
import Link from "next/link";
import { CourseListItem } from "@/types/entities";
import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DataCards,
  DataTable,
  DataTableFilterConfig,
  DataTableMobileConfig,
  DataTablePaginationOptions,
} from "@/shadcn/components/data-table";
import { Button } from "@/shadcn/components/ui/button";
import { LayoutGrid, Table2 } from "lucide-react";

function renderCourseActions(course: CourseViewItem) {
  return (
    <div className="flex items-center justify-center gap-6">
      <Link
        href={`/dashboard/my-courses/${course.id}/lectures`}
        className="text-olive-300 hover:text-olive-700 transition-colors"
      >
        <InfoIcon />
      </Link>
    </div>
  );
}

export default function InstructorMyCoursesView({
  courses,
}: {
  courses: CourseListItem[];
}) {
  const [layout, setLayout] = useState<"table" | "cards">("table");
  const { courses: viewCourses } = buildInstructorMyCoursesConfig(courses);

  const seasonOptions = useMemo(
    () =>
      Array.from(
        new Set(
          viewCourses.map((course) => course.season_name).filter(Boolean),
        ),
      ),
    [viewCourses],
  );

  const columns = useMemo<ColumnDef<CourseViewItem>[]>(
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
        accessorKey: "season_name",
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
          <span>{formatDate(parseISO(row.getValue("start_date")))}</span>
        ),
      },
      {
        accessorKey: "end_date",
        header: "النهاية",
        cell: ({ row }) => {
          const endDate = row.getValue("end_date") as string | null;
          return (
            <span>{endDate ? formatDate(parseISO(endDate)) : "غير محدد"}</span>
          );
        },
      },
      {
        accessorKey: "course_state",
        header: "الحالة",
        filterFn: (row, columnId, value: string) => {
          if (!value || value === "all") return true;
          return row.getValue(columnId) === value;
        },
        cell: ({ row }) => {
          const state = row.getValue(
            "course_state",
          ) as CourseViewItem["course_state"];
          const stateMap = {
            ongoing: "جارية",
            upcoming: "قادمة",
            ended: "منتهية",
          };

          return <span>{stateMap[state]}</span>;
        },
      },
      {
        accessorKey: "availability",
        header: "التسجيل",
        filterFn: (row, columnId, value: string) => {
          if (!value || value === "all") return true;
          return row.getValue(columnId) === value;
        },
        cell: ({ row }) => {
          const availability = row.getValue(
            "availability",
          ) as CourseViewItem["availability"];
          return (
            <span>{availability === "open" ? "متاحة للتسجيل" : "مكتملة"}</span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => renderCourseActions(row.original),
      },
    ],
    [],
  );

  const filters = useMemo<DataTableFilterConfig[]>(() => {
    const courseStateFilter: DataTableFilterConfig = {
      columnId: "course_state",
      label: "الحالة",
      options: [
        { label: "الكل", value: "all" },
        { label: "جارية", value: "ongoing" },
        { label: "قادمة", value: "upcoming" },
        { label: "منتهية", value: "ended" },
      ],
    };

    const availabilityFilter: DataTableFilterConfig = {
      columnId: "availability",
      label: "التسجيل",
      options: [
        { label: "الكل", value: "all" },
        { label: "متاحة للتسجيل", value: "open" },
        { label: "مكتملة", value: "full" },
      ],
    };

    const seasonFilter: DataTableFilterConfig = {
      columnId: "season_name",
      label: "الموسم",
      options: [
        { label: "الكل", value: "all" },
        ...seasonOptions.map((season) => ({ label: season, value: season })),
      ],
    };

    return [courseStateFilter, availabilityFilter, seasonFilter];
  }, [seasonOptions]);

  const mobileConfig: DataTableMobileConfig<CourseViewItem> = {
    renderTitle: (course, index) => (
      <span>
        {toHindiDigits(index + 1)}- {course.name}
      </span>
    ),
    renderSubtitle: (course) => (
      <span className="text-olive-400">{course.season_name}</span>
    ),
    renderContent: (course) => (
      <div className="space-y-3 text-[1.4rem]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">البداية :</span>
          <span>{formatDate(parseISO(course.start_date))}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">النهاية :</span>
          <span>
            {course.end_date
              ? formatDate(parseISO(course.end_date))
              : "غير محدد"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">الحالة :</span>
          <span>
            {course.course_state === "ongoing"
              ? "جارية"
              : course.course_state === "upcoming"
                ? "قادمة"
                : "منتهية"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-500">التسجيل :</span>
          <span>
            {course.availability === "open" ? "متاحة للتسجيل" : "مكتملة"}
          </span>
        </div>
      </div>
    ),
    renderActions: (course) => renderCourseActions(course),
  };

  const paginationOptions: DataTablePaginationOptions = {
    onNext: (_nextPage) => {},
  };

  return (
    <div className="space-y-8 px-16">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-100 p-1 shadow-sm">
          <Button
            variant={layout === "table" ? "default" : "ghost"}
            size="icon-sm"
            className={cn(
              "rounded-lg",
              layout === "table" &&
                "bg-olive-400 hover:bg-olive-500 text-white",
            )}
            onClick={() => setLayout("table")}
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={layout === "cards" ? "default" : "ghost"}
            size="icon-sm"
            className={cn(
              "rounded-lg",
              layout === "cards" &&
                "bg-olive-400 hover:bg-olive-500 text-white",
            )}
            onClick={() => setLayout("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {layout === "table" ? (
        <DataTable
          columns={columns}
          data={viewCourses}
          searchKey="name"
          searchPlaceholder="ابحث عن دورة..."
          filters={filters}
          showColumnVisibilityToggle
          mobileConfig={mobileConfig}
          paginationOptions={paginationOptions}
          pageSize={7}
        />
      ) : (
        <DataCards
          columns={columns}
          data={viewCourses}
          searchKey="name"
          searchPlaceholder="ابحث عن دورة..."
          filters={filters}
          paginationOptions={paginationOptions}
          pageSize={8}
          gridClassName="grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          renderCard={(item, index) => (
            <MyCourseCard course={item} index={index} key={item.id} />
          )}
        />
      )}
    </div>
  );
}
