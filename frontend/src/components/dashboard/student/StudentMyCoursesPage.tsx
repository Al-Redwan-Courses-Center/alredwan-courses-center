import { getUser } from "@/actions/auth";
import StudentMyCoursesView from "@/components/dashboard/student/StudentMyCoursesView";
import { getMyChildById } from "@/dev-data/db";
import { Suspense } from "react";

export default async function StudentMyCoursesPage({
  childId = "",
}: {
  childId?: string;
}) {
  const { first_name, role } = await getUser();
  let name: string;

  if (role === "parent") {
    // TODO(api): Replace mock child details when the API provides child info.
    name = getMyChildById(childId).name;
  } else {
    name = first_name;
  }

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h3 className="text-olive-700 font-medad mb-14 ps-16 text-6xl">
        السلام عليكم يا {name}
      </h3>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <StudentMyCoursesView childId={childId} role={role} />
        </Suspense>
      </div>
    </div>
  );
}
