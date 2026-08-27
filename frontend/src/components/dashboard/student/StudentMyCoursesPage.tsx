import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getChildById, getChildCourses } from "@/actions/user";
import { getStudentCourses } from "@/actions/courses";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { notFound, redirect } from "next/navigation";
import type { StudentCourseItem } from "@/types/entities";

export default async function StudentMyCoursesPage({
  childId = "",
}: {
  childId?: string;
}) {
  const { first_name: name, role } = await getUser();
  let myActiveCourses: StudentCourseItem[];

  if (role === "parent") {
    const child = await getChildById(childId);
    if (!child) return notFound();

    myActiveCourses = await getChildCourses(childId);
  } else if (role === "student") {
    myActiveCourses = await getStudentCourses();
  } else {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h1 className="dashboard-greeting mb-14 ps-16">لوحة تحكم {name}</h1>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <StudentMyCoursesView courses={myActiveCourses} />
        </Suspense>
      </div>
    </div>
  );
}
