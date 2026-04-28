"use client";

import PublicCourseCard from "@/components/courses/PublicCourseCard";
import { CourseListItem } from "@/types/entities";
import { buildAllCoursesView } from "@/components/dashboard/dashboard-all-courses-view-config";
import { DataCards } from "@/shadcn/components/data-table";

import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<CourseListItem>[] = [
  {
    accessorKey: "name",
    header: "الدورة",
  },
  {
    accessorKey: "start_date",
    header: "البداية",
  },
  {
    accessorKey: "price",
    header: "السعر",
  },
];

export default function DashboardAllCoursesView({
  courses: inputCourses = [],
}: {
  courses?: CourseListItem[];
}) {
  const courses = buildAllCoursesView(inputCourses);

  return (
    <div className="mx-auto w-full px-8 py-6">
      <DataCards
        data={courses}
        columns={columns}
        searches={[{ searchKey: "name", placeholder: "ابحث عن دورة..." }]}
        pageSize={8}
        renderCard={(item: CourseListItem, index: number) => (
          <PublicCourseCard
            linkTo="dashboard"
            course={item}
            index={index}
            key={item.id}
          />
        )}
      />
    </div>
  );
}
