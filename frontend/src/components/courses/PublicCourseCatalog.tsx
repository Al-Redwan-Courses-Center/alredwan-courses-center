"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // The tab lives in the URL so it survives refreshes and back/forward,
  // and so it needs no state to keep in sync.
  const activeTab =
    searchParams.get("type") === "online" ? "online" : "physical";

  const setActiveTab = (tab: "physical" | "online") => {
    if (tab === activeTab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("type", tab);
    // Each tab paginates its own list, so a page number from one tab
    // is meaningless on the other.
    params.delete("page");
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
