import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getChildById, getChildCourses, getParentChildren } from "@/actions/user";
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
  let activeChildId = childId;

  if (role === "parent") {
    if (!activeChildId) {
      const children = await getParentChildren();
      activeChildId = children[0]?.id || "";
    }
    if (!activeChildId) return notFound();

    const child = await getChildById(activeChildId);
    if (!child) return notFound();

    myActiveCourses = await getChildCourses(activeChildId);
  } else if (role === "student") {
    myActiveCourses = await getStudentCourses();
  } else {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15 w-full overflow-x-auto">
      <h1 className="dashboard-greeting mb-6 sm:mb-14 px-4 sm:px-8 xl:px-16">لوحة تحكم {name}</h1>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <StudentMyCoursesView
            courses={myActiveCourses}
            role={role}
            childId={activeChildId}
          />
        </Suspense>
      </div>
    </div>
  );
}
