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
import type { StudentCourseItem } from "@/types/entities";
import type { UserEntity } from "@/types/auth";

export default function StudentMyCoursesView({
  courses,
  role,
  childId,
}: {
  courses: StudentCourseItem[];
  childId?: string;
  role: UserEntity["role"];
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
      <div className="tablet:flex-col tablet:items-stretch tablet:gap-12 relative z-60 mb-14 flex items-center justify-between gap-16 px-4 tablet:px-16 tablet-sm:px-4">
        <div className="tablet:max-w-full w-full max-w-[400px]">
          <DataViewSearchLegacy />
        </div>
        <div className="tablet:w-full flex items-center gap-12">
          <div className="tablet:flex-1 w-auto">
            <DataViewSortLegacy />
          </div>
          <div className="tablet:flex-1 w-auto">
            <DataViewFilterLegacy />
          </div>
        </div>
      </div>

      <DataViewHeaderLegacy className="mx-4 tablet:mx-16 tablet-sm:mx-4 hidden lg:grid">
        <DataViewCellLegacy>م</DataViewCellLegacy>
        <DataViewCellLegacy>الدورة</DataViewCellLegacy>
        <DataViewCellLegacy>الموسم</DataViewCellLegacy>
        <DataViewCellLegacy>البداية</DataViewCellLegacy>
        <DataViewCellLegacy>النهاية</DataViewCellLegacy>
        <DataViewCellLegacy></DataViewCellLegacy>
      </DataViewHeaderLegacy>

      <DataViewBodyLegacy
        className="px-4 tablet:px-16 tablet-sm:px-4 tablet-sm:!grid tablet-sm:!grid-cols-1 tablet-sm:!overflow-hidden w-full [&_>_div]:!min-w-0"
        render={{
          table: () => null,

          cards: (item: StudentCourseItem, index) => (
            <StudentCourseCard
              course={item}
              index={index}
              key={item.id}
              role={role}
              childId={childId}
            />
          ),
        }}
      />

      <DataViewPaginationLegacy />
    </DataViewLegacy>
  );
}
