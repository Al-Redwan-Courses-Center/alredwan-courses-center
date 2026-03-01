import { getUser, protect } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
import { Suspense } from "react";

export default async function Page() {
  await protect(["student", "parent"]);

  const { first_name } = await getUser();
  const courses = await getAllCourses();

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h3 className="text-olive-700 font-medad mb-14 ps-16 text-6xl">
        السلام عليكم يا {first_name}
      </h3>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <DashboardAllCoursesView courses={courses} />
        </Suspense>
      </div>
    </div>
  );
}
