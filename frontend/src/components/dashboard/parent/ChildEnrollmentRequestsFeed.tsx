"use client";

import { useState, useMemo } from "react";
import { ParentChildDetail } from "@/actions/user";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import { toHindiDigits, cn } from "@/lib/utils";
import { EnrollmentRequestListItem } from "@/types/entities";

export default function ChildEnrollmentRequestsFeed({
  childrenList,
  initialRequests,
}: {
  childrenList: ParentChildDetail[];
  initialRequests: { [childId: string]: EnrollmentRequestListItem[] };
}) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Determine which enrollment requests to display based on active tab
  const displayedRequests = useMemo(() => {
    const list: EnrollmentRequestListItem[] =
      activeTab === "all"
        ? Object.values(initialRequests).flat()
        : initialRequests[activeTab] || [];

    return [...list].sort(
      (a, b) =>
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ] -
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ]
    );
  }, [initialRequests, activeTab]);

  return (
    <div className="flex flex-col gap-8">
      {/* Tab Pills */}
      <div className="flex flex-wrap items-center gap-4 px-6">
        <span className="text-2xl font-bold text-gray-500 me-4">تصفية طلبات الاشتراك:</span>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-8 py-3 rounded-full text-xl font-bold transition-all cursor-pointer",
            activeTab === "all"
              ? "bg-olive-700 text-white shadow-md"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          )}
        >
          الكل ({toHindiDigits(Object.values(initialRequests).flat().length)})
        </button>
        {childrenList.map((c, i) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            className={cn(
              "px-8 py-3 rounded-full text-xl font-bold transition-all cursor-pointer",
              activeTab === c.id
                ? "bg-olive-700 text-white shadow-md"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            )}
          >
            {`(${toHindiDigits(i + 1)}) ${c.first_name}`} ({toHindiDigits((initialRequests[c.id] || []).length)})
          </button>
        ))}
      </div>

      {/* Feed Content */}
      <div className="relative min-h-[30rem]">
        <EnrollmentRequestsList
          enrollments={displayedRequests}
          listStyles="flex flex-col gap-4 max-h-[45rem] overflow-y-auto"
          wrapperStyles="*:px-6! ps-0! pb-0"
        />
      </div>
    </div>
  );
}

