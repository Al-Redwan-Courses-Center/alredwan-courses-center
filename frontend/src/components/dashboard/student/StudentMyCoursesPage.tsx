import { getUser } from "@/actions/auth";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { Suspense } from "react";

export default async function StudentMyCoursesPage() {
  const { first_name } = await getUser();

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h3 className="text-olive-700 font-medad mb-14 ps-16 text-6xl">
        السلام عليكم يا {first_name}
      </h3>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <StudentMyCoursesView />
        </Suspense>
      </div>
    </div>
  );
}
