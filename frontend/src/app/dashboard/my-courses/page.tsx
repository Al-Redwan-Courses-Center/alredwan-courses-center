import { getUser } from "@/actions/auth";
import CourseTable from "@/components/courses/CourseTable";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "جميع الدورات",
};

export default async function Page() {
  const { first_name } = await getUser();

  return (
    <>
      <h1 className="text-olive-700 font-medad mb-14 text-6xl">
        السلام عليكم يا أخ {first_name}
      </h1>

      <Suspense fallback={null}>
        <CourseTable />
      </Suspense>
    </>
  );
}
