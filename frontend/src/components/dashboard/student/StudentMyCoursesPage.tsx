import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getStudentCourses } from "@/actions/courses";
import { getChildCourses, getChildById } from "@/actions/user";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { notFound, redirect } from "next/navigation";
import { CourseDetail } from "@/types/entities";

export default async function StudentMyCoursesPage({
  childId = "",
}: {
  childId?: string;
}) {
  const { first_name, role } = await getUser();
  let myActiveCourses: CourseDetail[];
  let name: string;

  if (role === "parent") {
    const child = await getChildById(childId);
    if (!child) return notFound();

    myActiveCourses = await getChildCourses(childId);
    name = child.first_name;
  } else if (role === "student") {
    myActiveCourses = await getStudentCourses();
    name = first_name;
  } else {
    redirect("/dashboard");
  }

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
