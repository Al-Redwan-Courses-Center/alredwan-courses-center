import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
import { Metadata } from "next";
import { Suspense } from "react";
import { getPublicCourses } from "@/actions/courses";

export const metadata: Metadata = {
  title: "الدورات",
};

export default async function Page() {
  const courses = await getPublicCourses();
  
  return (
    <div className="mx-auto max-h-full w-full max-w-[1280px] px-6 md:px-16 pt-10 pb-50">
      <Suspense fallback={null}>
        <DashboardAllCoursesView courses={courses} />
      </Suspense>
    </div>
  );
}
