"use client";

import MyCourseCard from "@/components/courses/MyCourseCard";
import InfoIcon from "@/components/icons/InfoIcon";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
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
import buildInstructorMyCoursesConfig, {
  CourseViewItem,
} from "@/components/dashboard/instructor/instructor-my-courses-view-config";
import { parseISO } from "date-fns";
import Link from "next/link";
import { CourseListItem } from "@/types/entities";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";

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
      <div className="mb-14 flex items-center gap-32 ps-16">
        <DataViewSearch />
        <DataViewSort />
        <DataViewFilter />
        <DataViewLayoutToggle />
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
