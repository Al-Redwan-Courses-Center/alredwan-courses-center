import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getStudentCourses } from "@/actions/courses";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { getChildOngoingEnrollments, getMyChildById } from "@/dev-data/db";

export default async function StudentMyCoursesPage({
  childId = "",
}: {
  childId?: string;
}) {
  const { first_name, role } = await getUser();
  let myActiveCourses, name: string;

  if (role === "parent") {
    // TODO(api): Replace mock child details when the API provides child info.
    myActiveCourses = getChildOngoingEnrollments(childId).map((e) => e.course);
    name = getMyChildById(childId).name;
  } else {
    myActiveCourses = await getStudentCourses();
    name = first_name;
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
