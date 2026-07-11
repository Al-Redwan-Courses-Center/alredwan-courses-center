import { getUser, protect } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
import { Suspense } from "react";

export default async function Page() {
  await protect(["student", "parent"]);

  const { first_name } = await getUser();
  const courses = await getAllCourses();

  return (
    <div className="flex flex-col pt-15 min-[1000px]:pt-32">
      <h1 className="dashboard-greeting mb-14 ps-16 relative z-60">
        السلام عليكم يا {first_name}
      </h1>

      <div className="w-full">
        <Suspense fallback={null}>
          <DashboardAllCoursesView courses={courses} />
        </Suspense>
      </div>
    </div>
  );
}
