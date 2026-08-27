"use client";

import StudentCourseCard from "@/components/dashboard/student/StudentCourseCard";
import DataViewLegacy from "@/components/ui/data-view/DataView";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewFilterLegacy from "@/components/ui/data-view/DataViewFilter";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import { DataViewHeaderLegacy } from "@/components/ui/data-view/DataViewRow";
import DataViewSearchLegacy from "@/components/ui/data-view/DataViewSearch";
import DataViewSortLegacy from "@/components/ui/data-view/DataViewSort";
import { cn } from "@/lib/utils";
import type { CourseDetail } from "@/types/entities";

export default function StudentMyCoursesView({
  courses,
}: {
  courses: CourseDetail[];
  childId?: string;
  role?: string;
}) {
  return (
    <DataViewLegacy
      data={courses}
      maxItemsPerPage={8}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
      filterConfig={{
        test: {
          key: "أ",
          label: "Abc",
        },
      }}
      sortConfig={{
        test: {
          label: "Abc",
          sortFn: () => 1,
        },
      }}
      viewLayout="cards"
    >
      <div className="mb-14 flex items-center gap-32 ps-16">
        <DataViewSearchLegacy />
        <DataViewSortLegacy />
        <DataViewFilterLegacy />
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

          cards: (
            item: CourseDetail & { course_progress: number; type: "physical" | "online"; enrollment_status?: string; enrollment_status_display?: string },
            index,
          ) => <StudentCourseCard course={item} index={index} key={item.id} />,
        }}
      />

      <DataViewPaginationLegacy />
    </DataViewLegacy>
  );
}
