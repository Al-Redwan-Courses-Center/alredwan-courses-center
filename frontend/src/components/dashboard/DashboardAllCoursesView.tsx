"use client";

import PublicCourseCard from "@/components/courses/PublicCourseCard";
import DataView from "@/components/ui/data-view/DataView";

import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import { DataViewHeaderLegacy } from "@/components/ui/data-view/DataViewRow";

import { cn } from "@/lib/utils";
import { CourseListItem } from "@/types/entities";
import {
  buildAllCoursesView,
  getAllCoursesFilterConfig,
  sortConfig,
} from "@/components/dashboard/dashboard-all-courses-view-config";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewSearchLegacy from "@/components/ui/data-view/DataViewSearch";
import DataViewSortLegacy from "../ui/data-view/DataViewSort";
import DataViewFilterLegacy from "@/components/ui/data-view/DataViewFilter";

export default function DashboardAllCoursesView({
  courses: inputCourses = [],
}: {
  courses?: CourseListItem[];
}) {
  const courses = buildAllCoursesView(inputCourses);
  const filterConfig = getAllCoursesFilterConfig(courses);

  return (
    <DataView
      data={courses}
      maxItemsPerPage={8}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
      filterConfig={filterConfig}
      sortConfig={sortConfig}
      viewLayout="cards"
    >
      <div className="mb-12 flex flex-col gap-4 ps-16 pe-16 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-6">
        <div className="min-w-0 flex-1">
          <DataViewSearchLegacy />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <DataViewSortLegacy />
          <DataViewFilterLegacy />
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

      <DataViewBodyLegacy
        className="px-16"
        render={{
          table: () => null,

          cards: (item: CourseListItem, index) => (
            <PublicCourseCard
              linkTo="dashboard"
              course={item}
              index={index}
              key={item.id}
            />
          ),
        }}
      />

      <DataViewPaginationLegacy />
    </DataView>
  );
}
