"use client";

import PublicCourseCard from "@/components/courses/PublicCourseCard";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import { DataViewPagination } from "@/components/ui/data-view/DataViewPagination";
import { DataViewHeader } from "@/components/ui/data-view/DataViewRow";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import { cn } from "@/lib/utils";
import { CourseListItem } from "@/types/entities";
import {
  buildAllCoursesView,
  getAllCoursesFilterConfig,
  sortConfig,
} from "@/components/dashboard/dashboard-all-courses-view-config";

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
      <div className="mb-14 flex items-center gap-32 ps-16">
        <DataViewSearch />
        <DataViewSort />
        <DataViewFilter />
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

      <DataViewPagination />
    </DataView>
  );
}
