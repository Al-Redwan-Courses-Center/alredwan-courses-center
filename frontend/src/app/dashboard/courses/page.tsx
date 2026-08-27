import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";

export default async function Page() {
  const { first_name } = await getUser();
  const courses = await getAllCourses();

  return (
    <div className="flex flex-col pt-15 min-[1000px]:pt-32">
      <h1 className="dashboard-greeting relative z-60 mb-14 ps-16">
        السلام عليكم يا {first_name}
      </h1>

      <div className="w-full">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-xl text-gray-500">
              جاري التحميل...
            </div>
          }
        >
          <PublicCourseCatalog
            physical={physicalCourses}
            online={onlineCourses}
            linkTo="dashboard"
          />
        </Suspense>
      </div>
    </div>
  );
}
