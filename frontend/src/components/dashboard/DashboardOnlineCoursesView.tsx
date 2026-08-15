"use client";

import OnlineCourseCard from "@/components/dashboard/online-courses/OnlineCourseCard";
import DataView from "@/components/ui/data-view/DataView";

import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import { DataViewHeaderLegacy } from "@/components/ui/data-view/DataViewRow";

import { cn } from "@/lib/utils";
import { OnlineCourseListItem } from "@/types/entities";
import {
  buildOnlineCoursesView,
  getOnlineCoursesFilterConfig,
  sortOnlineCoursesConfig,
} from "@/components/dashboard/dashboard-online-courses-view-config";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewSearchLegacy from "@/components/ui/data-view/DataViewSearch";
import DataViewSortLegacy from "@/components/ui/data-view/DataViewSort";
import DataViewFilterLegacy from "@/components/ui/data-view/DataViewFilter";

export default function DashboardOnlineCoursesView({
  courses: inputCourses = [],
  linkTo = "dashboard",
}: {
  courses?: OnlineCourseListItem[];
  linkTo?: "dashboard" | "landing";
}) {
  const courses = buildOnlineCoursesView(inputCourses);
  const filterConfig = getOnlineCoursesFilterConfig(courses);

  return (
    <DataView
      data={courses}
      maxItemsPerPage={8}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
      filterConfig={filterConfig}
      sortConfig={sortOnlineCoursesConfig}
      viewLayout="cards"
    >
      <div className="relative z-60 mb-14 flex items-center justify-between gap-16 px-16 tablet:flex-col tablet:items-stretch tablet:gap-12">
        <div className="w-full max-w-[400px] tablet:max-w-full">
          <DataViewSearchLegacy />
        </div>
        <div className="flex items-center gap-12 tablet:w-full">
          <div className="tablet:flex-1 w-auto">
            <DataViewSortLegacy />
          </div>
          <div className="tablet:flex-1 w-auto">
            <DataViewFilterLegacy />
          </div>
        </div>
      </div>

      <DataViewHeaderLegacy className="mx-16">
        <DataViewCellLegacy>م</DataViewCellLegacy>
        <DataViewCellLegacy>الدورة</DataViewCellLegacy>
        <DataViewCellLegacy>المدرب</DataViewCellLegacy>
        <DataViewCellLegacy>السعر</DataViewCellLegacy>
        <DataViewCellLegacy>المدة</DataViewCellLegacy>
        <DataViewCellLegacy></DataViewCellLegacy>
      </DataViewHeaderLegacy>

      <DataViewBodyLegacy
        className="px-16"
        render={{
          table: () => null,
          cards: (item: OnlineCourseListItem, index) => (
            <OnlineCourseCard
              course={item}
              index={index}
              key={item.id}
              linkTo={linkTo}
            />
          ),
        }}
      />

      <DataViewPaginationLegacy />
    </DataView>
  );
}
