import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import { getAllOnlineCourses } from "@/actions/online-courses";
import PublicCourseCatalog from "@/components/courses/PublicCourseCatalog";

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
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-xl text-gray-500">جاري التحميل...</div>}>
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
