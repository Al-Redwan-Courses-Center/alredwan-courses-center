import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getChildById } from "@/actions/user";
import { getStudentCourses } from "@/actions/courses";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { CourseDetail } from "@/types/entities";

export default async function StudentMyCoursesPage({
  childId = "",
}: {
  childId?: string;
}) {
  const { first_name } = await getUser();
  const myActiveCourses: CourseDetail[] = await getStudentCourses();
  const name: string = childId
    ? ((await getChildById(childId))?.first_name ?? "Unknown")
    : first_name;

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
