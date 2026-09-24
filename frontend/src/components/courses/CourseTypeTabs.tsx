"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type CourseType = "physical" | "online";

/**
 * The active tab lives in the URL (`?type=online`) so it survives refreshes
 * and back/forward, and so it needs no state to keep in sync.
 */
export function useCourseTypeTab() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab: CourseType =
    searchParams.get("type") === "online" ? "online" : "physical";

  const setActiveTab = (tab: CourseType) => {
    if (tab === activeTab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("type", tab);
    // Each tab paginates its own list, so a page number from one tab
    // is meaningless on the other.
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return { activeTab, setActiveTab };
}

const TABS: { value: CourseType; label: string }[] = [
  { value: "physical", label: "الدورات الحضورية" },
  { value: "online", label: "الدورات الإلكترونية" },
];

export default function CourseTypeTabs({ className }: { className?: string }) {
  const { activeTab, setActiveTab } = useCourseTypeTab();

  return (
    <div
      role="tablist"
      className={cn(
        "flex w-full max-w-[600px] rounded-xl bg-gray-100 p-1.5 shadow-inner",
        className,
      )}
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => setActiveTab(tab.value)}
          className={cn(
            "flex-1 rounded-lg py-3 text-lg font-bold transition-all duration-300",
            activeTab === tab.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-800",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
