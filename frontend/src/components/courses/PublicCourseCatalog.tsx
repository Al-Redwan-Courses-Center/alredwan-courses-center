"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CourseListItem, OnlineCourseListItem } from "@/types/entities";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";
import DashboardOnlineCoursesView from "@/components/dashboard/DashboardOnlineCoursesView";

interface PublicCourseCatalogProps {
  physical: CourseListItem[];
  online: OnlineCourseListItem[];
}

export default function PublicCourseCatalog({
  physical,
  online,
  linkTo = "landing",
  showEnroll = false,
}: PublicCourseCatalogProps & {
  linkTo?: "landing" | "dashboard";
  showEnroll: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The tab lives in the URL so it survives refreshes and back/forward,
  // and so it needs no state to keep in sync.
  const activeTab =
    searchParams.get("type") === "online" ? "online" : "physical";

  const setActiveTab = (tab: "physical" | "online") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="mt-2 mb-8 flex w-full flex-col items-center justify-center gap-6">
        {linkTo !== "dashboard" && (
          <h1 className="font-medad text-4xl font-extrabold text-gray-900">
            معرض الدورات
          </h1>
        )}

        <div className="flex w-full max-w-[600px] rounded-xl bg-gray-100 p-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab("physical")}
            className={`flex-1 rounded-lg py-3 text-lg font-bold transition-all duration-300 ${
              activeTab === "physical"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            الدورات الحضورية
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`flex-1 rounded-lg py-3 text-lg font-bold transition-all duration-300 ${
              activeTab === "online"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            الدورات الإلكترونية
          </button>
        </div>
      </div>

      {activeTab === "physical" && (
        <div className="w-full">
          <DashboardAllCoursesView
            courses={physical}
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
