import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "الدورات",
};

export default function Page() {
  return (
    <div className="mx-auto max-h-full w-fit pt-10 pb-50">
      <Suspense fallback={null}>
        <DashboardAllCoursesView />
      </Suspense>
    </div>
  );
}
