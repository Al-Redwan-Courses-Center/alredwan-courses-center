"use client";

import CourseTypeTabs, {
  useCourseTypeTab,
} from "@/components/courses/CourseTypeTabs";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
import DashboardOnlineCoursesView from "@/components/dashboard/DashboardOnlineCoursesView";
import { CourseListItem, OnlineCourseListItem } from "@/types/entities";

interface PublicCourseCatalogProps {
  physical: CourseListItem[];
  online: OnlineCourseListItem[];
  /** Server-side pagination info for the physical courses list. */
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  linkTo?: "landing" | "dashboard";
  showEnroll?: boolean;
}

export default function PublicCourseCatalog({
  physical,
  online,
  totalCount,
  totalPages,
  currentPage,
  linkTo = "landing",
  showEnroll = false,
}: PublicCourseCatalogProps) {
  const { activeTab } = useCourseTypeTab();

  return (
    <div className="space-y-6">
      <div className="mt-2 mb-8 flex w-full flex-col items-center justify-center gap-6">
        {linkTo !== "dashboard" && (
          <h1 className="font-medad text-4xl font-extrabold text-gray-900">
            معرض الدورات
          </h1>
        )}

        <CourseTypeTabs />
      </div>

      {activeTab === "physical" && (
        <div className="w-full">
          <DashboardAllCoursesView
            courses={physical}
            totalCount={totalCount}
            totalPages={totalPages}
            currentPage={currentPage}
            linkTo={linkTo}
            showEnroll={showEnroll}
          />
        </div>
      )}

      {activeTab === "online" && (
        <div className="w-full">
          <DashboardOnlineCoursesView courses={online} linkTo={linkTo} />
        </div>
      )}
    </div>
  );
}
