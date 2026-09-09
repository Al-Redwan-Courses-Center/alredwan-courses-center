"use client";

import { parseISO } from "date-fns";
import Link from "next/link";
import MyCourseCard from "@/components/courses/MyCourseCard";
import buildInstructorMyCoursesConfig, {
  type CourseViewItem,
} from "@/components/dashboard/instructor/instructor-my-courses-view-config";
import InfoIcon from "@/components/icons/InfoIcon";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewLayoutToggle from "@/components/ui/data-view/DataViewLayoutToggle";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "@/components/ui/data-view/DataViewRow";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import type { CourseListItem } from "@/types/entities";

export default function InstructorMyCoursesView({
  courses,
}: {
  courses: CourseListItem[];
}) {
  const {
    courses: viewCourses,
    filterConfig,
    sortConfig,
  } = buildInstructorMyCoursesConfig(courses);

  return (
    <DataView
      data={viewCourses}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
      filterConfig={filterConfig}
      sortConfig={sortConfig}
    >
      <div className="tablet:flex-col tablet:items-stretch tablet:gap-12 relative z-60 mb-14 flex items-center justify-between gap-16 px-16">
        <div className="tablet:max-w-full w-full max-w-[400px]">
          <DataViewSearch />
        </div>
        <div className="tablet:w-full flex items-center gap-12">
          <div className="tablet:flex-1 w-auto">
            <DataViewSort />
          </div>
          <div className="tablet:flex-1 w-auto">
            <DataViewFilter />
          </div>
          <div className="tablet:flex-1 w-auto">
            <DataViewLayoutToggle />
          </div>
        </div>
      </div>

      <DataViewHeaderLegacy className="mx-16">
        <DataViewCellLegacy>م</DataViewCellLegacy>
        <DataViewCellLegacy>الدورة</DataViewCellLegacy>
        <DataViewCellLegacy>الموسم</DataViewCellLegacy>
        <DataViewCellLegacy>البداية</DataViewCellLegacy>
        <DataViewCellLegacy>النهاية</DataViewCellLegacy>
        <DataViewCellLegacy></DataViewCellLegacy>
      </DataViewHeaderLegacy>

      <DataViewBody
        className="px-16"
        render={{
          table: (course: CourseViewItem, i) => (
            <DataViewRowLegacy index={i} key={course.id}>
              <DataViewCellLegacy>{toHindiDigits(i + 1)}</DataViewCellLegacy>
              <DataViewCellLegacy>{course.name}</DataViewCellLegacy>
              <DataViewCellLegacy>{course.season?.name}</DataViewCellLegacy>
              <DataViewCellLegacy>
                {formatDate(parseISO(course.start_date))}
              </DataViewCellLegacy>
              <DataViewCellLegacy>
                {course.end_date
                  ? formatDate(parseISO(course.end_date))
                  : "غير محدد"}
              </DataViewCellLegacy>
              <DataViewCellLegacy>
                <div className="flex items-center justify-center gap-6">
                  <Link
                    href={`/dashboard/my-courses/${course.id}/lectures`}
                    className="text-olive-300 hover:text-olive-700 transition-colors"
                  >
                    <InfoIcon />
                  </Link>
                </div>
              </DataViewCellLegacy>
            </DataViewRowLegacy>
          ),

          cards: (item: CourseViewItem, index) => (
            <MyCourseCard course={item} index={index} key={item.id} />
          ),
        }}
      />

      <DataViewPaginationLegacy />
    </DataView>
  );
}
