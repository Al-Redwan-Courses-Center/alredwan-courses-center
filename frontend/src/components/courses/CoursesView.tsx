"use client";

import CourseCard from "@/components/courses/CourseCard";
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
import { Course, MOCK_COURSES } from "@/dev-data/courses";
import { cn, toHindiDigits } from "@/lib/utils";
import Link from "next/link";

export default function CoursesView() {
  return (
    <DataView<Course>
      data={MOCK_COURSES}
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
          table: (item: Course, i) => (
            <DataViewRow index={i} key={item.id}>
              <DataViewCell>{toHindiDigits(item.id)}</DataViewCell>
              <DataViewCell>{item.name}</DataViewCell>
              <DataViewCell>{item.season?.name}</DataViewCell>
              <DataViewCell>{item.start_date}</DataViewCell>
              <DataViewCell>
                {item.end_date ? item.end_date : "غير محدد"}
              </DataViewCell>
              <DataViewCell>
                <div className="flex items-center justify-center gap-6">
                  <Link
                    href={`/dashboard/my-courses/${item.id}/lectures`}
                    className="text-olive-300 hover:text-olive-700 transition-colors"
                  >
                    <InfoIcon />
                  </Link>
                </div>
              </DataViewCell>
            </DataViewRow>
          ),

          cards: (item: Course, index) => (
            <CourseCard course={item} index={index} key={item.id} />
          ),
        }}
      />

      <DataViewPagination />
    </DataView>
  );
}
