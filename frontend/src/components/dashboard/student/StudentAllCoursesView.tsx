"use client";

import PublicCourseCard from "@/components/courses/PublicCourseCard";
import StudentCourseCard from "@/components/dashboard/student/StudentCourseCard";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import { DataViewPagination } from "@/components/ui/data-view/DataViewPagination";
import { DataViewHeader } from "@/components/ui/data-view/DataViewRow";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import { COURSES } from "@/dev-data/db";
import { cn } from "@/lib/utils";
import { Course } from "@/types/entities";

export default function StudentAllCoursesView() {
  return (
    <DataView
      data={COURSES}
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

          cards: (item: Course, index) => (
            <PublicCourseCard course={item} index={index} key={item.id} />
          ),
        }}
      />

      <DataViewPagination />
    </DataView>
  );
}
