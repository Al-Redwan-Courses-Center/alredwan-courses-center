import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getChildById } from "@/actions/user";
import { getStudentCourses } from "@/actions/courses";
import { getChildCourses, getChildById } from "@/actions/user";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseDetail } from "@/types/entities";

export default async function StudentMyCoursesPage({
  childId = "",
}: {
  childId?: string;
}) {
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseDetail } from "@/types/entities";

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h1 className="dashboard-greeting mb-14 ps-16">السلام عليكم يا {name}</h1>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <StudentMyCoursesView courses={myActiveCourses} />
        </Suspense>
      </div>
    </div>
  );
}
