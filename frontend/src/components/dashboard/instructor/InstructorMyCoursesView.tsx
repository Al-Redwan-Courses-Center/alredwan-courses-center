"use client";

import MyCourseCard from "@/components/courses/MyCourseCard";
import InfoIcon from "@/components/icons/InfoIcon";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewLayoutToggle from "@/components/ui/data-view/DataViewLayoutToggle";
import { DataViewPagination } from "@/components/ui/data-view/DataViewPagination";
import {
  DataViewHeader,
  DataViewRow,
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

      <DataViewHeader className="mx-16">
        <DataViewCell>م</DataViewCell>
        <DataViewCell>الدورة</DataViewCell>
        <DataViewCell>الموسم</DataViewCell>
        <DataViewCell>البداية</DataViewCell>
        <DataViewCell>النهاية</DataViewCell>
        <DataViewCell></DataViewCell>
      </DataViewHeader>

      <DataViewBody
        className="px-16"
        render={{
          table: (course: CourseViewItem, i) => (
            <DataViewRow index={i} key={course.id}>
              <DataViewCell>{toHindiDigits(i + 1)}</DataViewCell>
              <DataViewCell>{course.name}</DataViewCell>
              <DataViewCell>{course.season?.name}</DataViewCell>
              <DataViewCell>
                {formatDate(parseISO(course.start_date))}
              </DataViewCell>
              <DataViewCell>
                {course.end_date
                  ? formatDate(parseISO(course.end_date))
                  : "غير محدد"}
              </DataViewCell>
              <DataViewCell>
                <div className="flex items-center justify-center gap-6">
                  <Link
                    href={`/dashboard/my-courses/${course.id}/lectures`}
                    className="text-olive-300 hover:text-olive-700 transition-colors"
                  >
                    <InfoIcon />
                  </Link>
                </div>
              </DataViewCell>
            </DataViewRow>
          ),

          cards: (item: CourseViewItem, index) => (
            <MyCourseCard course={item} index={index} key={item.id} />
          ),
        }}
      />

      <DataViewPagination />
    </DataView>
  );
}
