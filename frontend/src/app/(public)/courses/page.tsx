import PublicCourseCatalog from "@/components/courses/PublicCourseCatalog";
import { Metadata } from "next";
import { Suspense } from "react";
import { getPublicCourses } from "@/actions/courses";
import { getPublicOnlineCourses } from "@/actions/online-courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الدورات | واحة الرضوان",
};

export default async function Page() {
  const [physicalCourses, onlineCourses] = await Promise.all([
    getPublicCourses(),
    getPublicOnlineCourses()
  ]);
  
  return (
    <div className="mx-auto max-h-full w-full max-w-[1400px] px-4 md:px-10 pt-10 pb-50">
      <Suspense fallback={<div className="h-64 flex items-center justify-center">جاري التحميل...</div>}>
        <PublicCourseCatalog physical={physicalCourses} online={onlineCourses} />
      </Suspense>
    </div>
  );
}
