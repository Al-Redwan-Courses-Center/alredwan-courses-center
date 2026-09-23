import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getInstructorCourses } from "@/actions/courses";
import { getInstructorOnlineCourses } from "@/actions/online-courses";
import InstructorMyCoursesCatalog from "@/components/dashboard/instructor/InstructorMyCoursesCatalog";

export default async function InstructorMyCoursesPage() {
  const { first_name, instructor_id } = await getUser();

  const [courses, onlineCourses] = await Promise.all([
    getInstructorCourses(instructor_id, { page_size: 100 }),
    getInstructorOnlineCourses(instructor_id),
  ]);

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h1 className="dashboard-greeting mb-14 ps-16">
        السلام عليكم يا أخ {first_name}
      </h1>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <InstructorMyCoursesCatalog
            physical={courses.results}
            online={onlineCourses}
          />
        </Suspense>
      </div>
    </div>
  );
}
