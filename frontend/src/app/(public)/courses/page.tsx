import StudentAllCoursesView from "@/components/dashboard/student/StudentAllCoursesView";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "الدورات",
};

export default function Page() {
  return (
    <div className="mx-auto max-h-full w-fit pt-10 pb-50">
      <Suspense fallback={null}>
        <StudentAllCoursesView />
      </Suspense>
    </div>
  );
}
