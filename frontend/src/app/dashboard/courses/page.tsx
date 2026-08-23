import { getUser } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import { getAllOnlineCourses } from "@/actions/online-courses";
import PublicCourseCatalog from "@/components/courses/PublicCourseCatalog";
import { Suspense } from "react";
import { getUser, protect } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
export default async function Page() {
  const [user, physicalCourses, onlineCourses] = await Promise.all([
    getUser(),
    getAllCourses(),
    getAllOnlineCourses(),
  ]);

  return (
    <div className="flex flex-col pt-15 min-[1000px]:pt-32">
      <h1 className="dashboard-greeting mb-14 ps-16 relative z-60">
        السلام عليكم يا {user.first_name}
      </h1>

      <div className="w-full">
        <PublicCourseCatalog
          physical={physicalCourses}
          online={onlineCourses}
          linkTo="dashboard"
        />
      </div>
    </div>
  );
}
