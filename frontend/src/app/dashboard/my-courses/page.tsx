import { getUser } from "@/actions/auth";
import MyCoursesView from "@/components/courses/MyCoursesView";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "جميع الدورات",
};

export default async function Page() {
  const { first_name } = await getUser();

  return (
    <div className="flex h-full max-h-73/100 flex-col pt-15">
      <h1 className="text-olive-700 font-medad mb-14 ps-16 text-6xl">
        السلام عليكم يا أخ {first_name}
      </h1>

      <div className="max-h-full w-full">
        <Suspense fallback={null}>
          <MyCoursesView />
        </Suspense>
      </div>
    </div>
  );
}
