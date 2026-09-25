"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import courseLecturesViewConfig, {
  buildCourseLecturesView,
  type LectureViewItem,
} from "@/components/courses/course-lectures-view.config";
import LectureEditModal from "@/components/courses/LectureEditModal";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, toHindiDigits } from "@/lib/utils";
import type { CourseDetail, LectureListItem } from "@/types/entities";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "@/components/ui/data-view/DataViewRow";

const { sortConfig, filterConfig, statusMap } = courseLecturesViewConfig;

export default function CourseLecturesView({
  lectures,
  course,
  childId,
}: {
  lectures: LectureListItem[];
  course: CourseDetail | null;
  childId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChildId = childId || searchParams.get("child") || undefined;

  function getLectureDetailUrl(lectureId: number | string) {
    if (pathname.startsWith("/dashboard/my-children/")) {
      const childIdFromPath = pathname.split("/")[3];
      return `/dashboard/my-children/${childIdFromPath}/courses/${course?.id}/lectures/${lectureId}`;
    }
    return `/dashboard/my-courses/${course?.id}/lectures/${lectureId}${
      activeChildId ? `?child=${activeChildId}` : ""
    }`;
  }
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  const isAdmin = userRole === "admin";
  const isInstructor = userRole === "instructor" || userRole === "teacher";

  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  const viewLectures = useMemo(
    () => buildCourseLecturesView(lectures, course),
    [lectures, course],
  );

  const [editingLecture, setEditingLecture] = useState<LectureListItem | null>(
    null,
  );

  function ActionButtons({
    lecture,
    isCard = false,
  }: {
    lecture: LectureListItem | LectureViewItem;
    isCard?: boolean;
  }) {
    return (
      <div
        className={cn(
          "*:text-olive-300 *:hover:text-olive-700 flex shrink-0 items-center justify-center *:transition-colors",
          isCard ? "gap-3" : "gap-6",
        )}
      >
        {canDelete && (
          <button
            type="button"
            title="حذف المحاضرة"
            className={cn(isCard && "p-1")}
          >
            <TrashIcon />
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            title="تعديل المحاضرة"
            onClick={(e) => {
              if (isCard) {
                e.preventDefault();
                e.stopPropagation();
              }
              setEditingLecture(lecture);
            }}
            className={cn(isCard && "p-1")}
          >
            <EditIcon />
          </button>
        )}

        <Link href={getLectureDetailUrl(lecture.id)} title="عرض التفاصيل">
          <InfoIcon />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full" dir="rtl">
        <DataView<LectureViewItem>
          data={viewLectures}
          maxItemsPerPage={5}
          sortConfig={sortConfig}
          filterConfig={filterConfig}
          gridLayout={cn(
            "grid-cols-[minmax(40px,0.5fr)_minmax(120px,2fr)_minmax(90px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)]",
          )}
        >
          {/* Controls Bar matching DashboardAllCoursesView */}
          <div className="tablet:flex-col tablet:items-stretch tablet:gap-6 relative z-60 mb-6 flex flex-col gap-4 px-3 sm:mb-14 sm:px-6 md:px-16">
            <div className="tablet:max-w-full w-full">
              <DataViewSearch placeholder="     ابحث عن محاضرة..." />
            </div>
            <div className="flex w-full items-center gap-2 sm:gap-4 md:gap-12">
              <div className="w-auto flex-1">
                <DataViewSort />
              </div>
              <div className="w-auto flex-1">
                <DataViewFilter />
              </div>
            </div>
          </div>

          <div className="no-scrollbar w-full overflow-x-auto pb-2">
            <div className="min-w-[650px] sm:min-w-full">
              <DataViewHeaderLegacy className="mx-3 sm:mx-6 md:mx-16">
                <DataViewCellLegacy>م</DataViewCellLegacy>
                <DataViewCellLegacy>المحاضرة</DataViewCellLegacy>
                <DataViewCellLegacy>التاريخ</DataViewCellLegacy>
                <DataViewCellLegacy>اليوم</DataViewCellLegacy>
                <DataViewCellLegacy>البداية</DataViewCellLegacy>
                <DataViewCellLegacy>النهاية</DataViewCellLegacy>
                <DataViewCellLegacy>الحالة</DataViewCellLegacy>
                <DataViewCellLegacy></DataViewCellLegacy>
              </DataViewHeaderLegacy>

              <DataViewBody
                className="w-full px-3 sm:px-6 md:px-16"
                render={{
                  table: (lecture: LectureViewItem, i: number) => {
                    const { label, color } = statusMap[lecture.status] || {
                      label: lecture.status_label || lecture.status,
                      color: "gray",
                    };

                    return (
                      <DataViewRowLegacy key={lecture.id} index={i}>
                        <DataViewCellLegacy className="font-bold whitespace-nowrap">
                          {toHindiDigits(lecture.lecture_number ?? i + 1)}
                        </DataViewCellLegacy>
                        <DataViewCellLegacy className="min-w-[100px] font-medium whitespace-nowrap">
                          {lecture.display_title}
                        </DataViewCellLegacy>
                        <DataViewCellLegacy className="whitespace-nowrap">
                          {lecture.formatted_date}
                        </DataViewCellLegacy>
                        <DataViewCellLegacy className="font-bold whitespace-nowrap">
                          {lecture.weekday}
                        </DataViewCellLegacy>
                        <DataViewCellLegacy className="font-bold whitespace-nowrap">
                          {lecture.formatted_start_time}
                        </DataViewCellLegacy>
                        <DataViewCellLegacy className="font-bold whitespace-nowrap">
                          {lecture.formatted_end_time}
                        </DataViewCellLegacy>
                        <DataViewCellLegacy>
                          <StatusBadge color={color}>{label}</StatusBadge>
                        </DataViewCellLegacy>
                        <DataViewCellLegacy>
                          <ActionButtons lecture={lecture} />
                        </DataViewCellLegacy>
                      </DataViewRowLegacy>
                    );
                  },

                  cards: (lecture: LectureViewItem) => {
                    const { label, color } = statusMap[lecture.status] || {
                      label: lecture.status_label || lecture.status,
                      color: "gray",
                    };
                    const detailUrl = getLectureDetailUrl(lecture.id);

                    return (
                      <div
                        key={lecture.id}
                        className="flex h-auto min-h-[200px] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md max-sm:w-[280px] max-sm:shrink-0"
                      >
                        <Link
                          href={detailUrl}
                          className="flex min-w-0 flex-1 cursor-pointer flex-col justify-between p-3 sm:p-4"
                        >
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <span className="text-olive-700 line-clamp-2 min-w-0 text-base font-semibold sm:text-[1.5rem]">
                              {lecture.display_title}
                            </span>
                            <StatusBadge
                              color={color}
                              className="shrink-0 text-xs sm:text-[1.2rem]"
                            >
                              {label}
                            </StatusBadge>
                          </div>
                          <div className="mt-2 min-w-0 space-y-1.5 text-xs text-gray-600 sm:text-[1.3rem]">
                            <div className="flex min-w-0 justify-between gap-2">
                              <span className="shrink-0">التاريخ:</span>
                              <span className="truncate text-left">
                                {lecture.formatted_date}
                              </span>
                            </div>
                            <div className="flex min-w-0 justify-between gap-2">
                              <span className="shrink-0">اليوم:</span>
                              <span className="truncate text-left">
                                {lecture.weekday}
                              </span>
                            </div>
                            <div className="flex min-w-0 justify-between gap-2">
                              <span className="shrink-0">البداية:</span>
                              <span className="truncate text-left">
                                {lecture.formatted_start_time}
                              </span>
                            </div>
                            <div className="flex min-w-0 justify-between gap-2">
                              <span className="shrink-0">النهاية:</span>
                              <span className="truncate text-left">
                                {lecture.formatted_end_time}
                              </span>
                            </div>
                          </div>
                        </Link>

                        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 p-2">
                          <ActionButtons lecture={lecture} isCard />
                        </div>
                      </div>
                    );
                  },
                }}
              />
            </div>
          </div>

          <DataViewPaginationLegacy />
        </DataView>
      </div>

      {canEdit && editingLecture && (
        <LectureEditModal
          key={editingLecture.id}
          lecture={editingLecture}
          isAdmin={isAdmin}
          onClose={() => setEditingLecture(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
