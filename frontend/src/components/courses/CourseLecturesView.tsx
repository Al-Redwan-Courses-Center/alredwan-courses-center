"use client";

import { useState } from "react";
import { parseISO } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import courseLecturesViewConfig from "@/components/courses/course-lectures-view.config";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewFilterLegacy from "@/components/ui/data-view/DataViewFilter";
import DataViewSearchLegacy from "@/components/ui/data-view/DataViewSearch";
import DataViewSortLegacy from "@/components/ui/data-view/DataViewSort";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  cn,
  formatDate,
  formatTime,
  getWeekDay,
  toHindiDigits,
} from "@/lib/utils";
import type { CourseDetail, LectureListItem } from "@/types/entities";
import { DataViewPaginationLegacy } from "../ui/data-view/DataViewPagination";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "../ui/data-view/DataViewRow";

const { sortConfig, filterConfig, statusMap } = courseLecturesViewConfig;

export default function CourseLecturesView({
  lectures,
  course,
}: {
  lectures: LectureListItem[];
  course: CourseDetail | null;
}) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const isAdmin = userRole === "admin";
  const canEditOrDelete = isAdmin;

  // حالة التحكم بالتركيز لمكون البحث
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <DataView
      data={lectures}
      maxItemsPerPage={5}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]",
      )}
    >
      {/* قسم شريط البحث والفلترة مع التفاعلات الديناميكية */}
      <div className="relative z-100 mb-14 flex items-center gap-32 transition-all duration-300">
        <DataViewSearchLegacy
          isFocused={isSearchFocused}
          setIsFocused={setIsSearchFocused}
        />

        {/* الحاويات الجانبية للفلترة والترتيب تنكمش وتختفي بسلاسة نحو اليسار */}
        <div
          className={cn(
            "flex items-center gap-32 transition-all duration-300 transform origin-left overflow-hidden",
            isSearchFocused
              ? "opacity-0 scale-95 max-w-0 pointer-events-none"
              : "opacity-100 scale-100 max-w-[500px]",
          )}
        >
          <DataViewSortLegacy />
          <DataViewFilterLegacy />
        </div>
      </div>

      <DataViewHeaderLegacy>
        <DataViewCellLegacy>م</DataViewCellLegacy>
        <DataViewCellLegacy>المحاضرة</DataViewCellLegacy>
        <DataViewCellLegacy>التاريخ</DataViewCellLegacy>
        <DataViewCellLegacy>اليوم</DataViewCellLegacy>
        <DataViewCellLegacy>البداية</DataViewCellLegacy>
        <DataViewCellLegacy>النهاية</DataViewCellLegacy>
        <DataViewCellLegacy>الحالة</DataViewCellLegacy>
        <DataViewCellLegacy></DataViewCellLegacy>
      </DataViewHeaderLegacy>

      <DataViewBodyLegacy
        render={{
          table: (lecture: LectureListItem, i: number) => {
            const { label, color } = statusMap[lecture.status] || {
              label: lecture.status,
              color: "gray",
            };
            const weekday = getWeekDay(parseISO(lecture.scheduled_at).getDay());

            return (
              <DataViewRowLegacy key={lecture.id} index={i}>
                <DataViewCellLegacy className="font-bold">
                  {toHindiDigits(i + 1)}
                </DataViewCellLegacy>

                <DataViewCellLegacy>{lecture.title}</DataViewCellLegacy>

                <DataViewCellLegacy>
                  {formatDate(parseISO(lecture.scheduled_at))}
                </DataViewCellLegacy>

                <DataViewCellLegacy className="font-bold">
                  {weekday}
                </DataViewCellLegacy>

                <DataViewCellLegacy className="font-bold">
                  {formatTime(lecture.start_time)}
                </DataViewCellLegacy>

                <DataViewCellLegacy className="font-bold">
                  {formatTime(lecture.end_time)}
                </DataViewCellLegacy>

                <DataViewCellLegacy>
                  <StatusBadge color={color}>{label}</StatusBadge>
                </DataViewCellLegacy>

                <DataViewCellLegacy>
                  <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-center gap-6 *:transition-colors">
                    {canEditOrDelete && (
                      <>
                        <button type="button" title="حذف المحاضرة">
                          <TrashIcon />
                        </button>

                        <Link
                          href={`/dashboard/my-courses/${course?.id}/lectures/`}
                          title="تعديل المحاضرة"
                        >
                          <EditIcon />
                        </Link>
                      </>
                    )}

                    <Link
                      href={`/dashboard/my-courses/${course?.id}/lectures/${lecture.id}`}
                      title="عرض التفاصيل"
                    >
                      <InfoIcon />
                    </Link>
                  </div>
                </DataViewCellLegacy>
              </DataViewRowLegacy>
            );
          },

          cards: () => null,
        }}
      />

      <DataViewPaginationLegacy />
    </DataView>
  );
}