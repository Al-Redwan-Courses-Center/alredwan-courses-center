"use client";

import CourseTypeTabs, {
  useCourseTypeTab,
} from "@/components/courses/CourseTypeTabs";
import DashboardOnlineCoursesView from "@/components/dashboard/DashboardOnlineCoursesView";
import InstructorMyCoursesView from "@/components/dashboard/instructor/InstructorMyCoursesView";
import EmptyState from "@/components/ui/EmptyState";
import type { CourseListItem, OnlineCourseListItem } from "@/types/entities";

export default function InstructorMyCoursesCatalog({
  physical,
  online,
}: {
  physical: CourseListItem[];
  online: OnlineCourseListItem[];
}) {
  const { activeTab } = useCourseTypeTab();

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="tablet:px-16 tablet-sm:px-4 flex justify-center px-4">
        <CourseTypeTabs />
      </div>

      {activeTab === "physical" && (
        <InstructorMyCoursesView courses={physical} />
      )}

      {activeTab === "online" &&
        (online.length > 0 ? (
          <DashboardOnlineCoursesView courses={online} linkTo="studio" />
        ) : (
          <EmptyState
            title="لا توجد دورات إلكترونية"
            description="لم يتم إسناد أي دورة إلكترونية إليك بعد. عند إضافة دورة إلكترونية باسمك ستظهر هنا."
          />
        ))}
    </div>
  );
}
