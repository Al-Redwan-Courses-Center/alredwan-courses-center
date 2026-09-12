"use client";

import { useMemo, useState } from "react";
import { parseISO } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import courseLecturesViewConfig, {
  buildCourseLecturesView,
  type LectureViewItem,
} from "@/components/courses/course-lectures-view.config";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewLayoutToggle from "@/components/ui/data-view/DataViewLayoutToggle";
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
import { updateLecture } from "@/actions/lectures";

const { sortConfig, filterConfig, statusMap } = courseLecturesViewConfig;

interface LectureUpdatePayload {
  title?: string;
  status?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("");

  function openEditModal(lecture: LectureListItem) {
    setEditingLecture(lecture);
    setTitle(lecture.title || "");
    try {
      const d = parseISO(lecture.scheduled_at);
      setDay(d.toISOString().slice(0, 10));
    } catch {
      setDay("");
    }
    setStartTime(lecture.start_time?.slice(0, 5) || "");
    setEndTime(lecture.end_time?.slice(0, 5) || "");
    setStatus(lecture.status || "scheduled");
    setFormError(null);
  }

  function closeEditModal() {
    setEditingLecture(null);
    setFormError(null);
  }

  async function handleSave() {
    if (!editingLecture) return;
    setIsSubmitting(true);
    setFormError(null);

    const payload: LectureUpdatePayload = {};

    if (!isAdmin) {
      if (day && day !== editingLecture.day) {
        setFormError("غير مسموح لك بتعديل تاريخ المحاضرة.");
        setIsSubmitting(false);
        return;
      }
      if (startTime && startTime !== editingLecture.start_time?.slice(0, 5)) {
        setFormError("غير مسموح لك بتعديل وقت البداية.");
        setIsSubmitting(false);
        return;
      }
      if (endTime && endTime !== editingLecture.end_time?.slice(0, 5)) {
        setFormError("غير مسموح لك بتعديل وقت النهاية.");
        setIsSubmitting(false);
        return;
      }
    }

    if (title.trim() && title.trim() !== editingLecture.title) {
      payload.title = title.trim();
    }

    if (status && status !== editingLecture.status) {
      payload.status = status;
    }

    if (isAdmin) {
      if (day && day !== editingLecture.day) {
        payload.day = day;
      }
      if (startTime && startTime !== editingLecture.start_time?.slice(0, 5)) {
        payload.start_time = `${startTime}:00`;
      }
      if (endTime && endTime !== editingLecture.end_time?.slice(0, 5)) {
        payload.end_time = `${endTime}:00`;
      }
    }

    if (Object.keys(payload).length === 0) {
      setFormError("لم تقم بأي تغيير.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await updateLecture(editingLecture.id, payload);

      if (result.success) {
        toast.success("تم تحديث المحاضرة بنجاح");
        closeEditModal();
        router.refresh();
      } else {
        toast.error(result.message || "فشل التحديث");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  }

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
          "flex shrink-0 items-center justify-center *:text-olive-300 *:transition-colors *:hover:text-olive-700",
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
              openEditModal(lecture);
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
              <div className="w-auto shrink-0">
                <DataViewLayoutToggle />
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
                            <span className="line-clamp-2 text-base font-semibold text-olive-700 sm:text-[1.5rem]">
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

      {/* Edit Modal */}
      {canEdit && editingLecture && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 [-webkit-backdrop-filter:blur(2px)] sm:p-4"
          onClick={closeEditModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-medad mb-1 text-lg font-bold text-olive-800 sm:text-[2rem]">
              تعديل المحاضرة
            </h2>
            <p className="mb-4 text-xs text-gray-500 sm:mb-5 sm:text-[1.4rem]">
              {isAdmin
                ? "🔓 صلاحيات أدمن — يمكنك تعديل كافة حقول المحاضرة"
                : "🔒 صلاحيات محاضر — يمكنك تعديل العنوان وحالة المحاضرة فقط"}
            </p>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]">
                  عنوان المحاضرة
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none sm:text-[1.4rem]"
                  placeholder="أدخل عنوان المحاضرة"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]">
                  تاريخ الانعقاد
                  {!isAdmin && (
                    <span className="mr-2 text-xs font-semibold text-amber-600 sm:text-[1.2rem]">
                      (للقراءة فقط)
                    </span>
                  )}
                </label>
                {isAdmin ? (
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none sm:text-[1.4rem]"
                  />
                ) : (
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 sm:text-[1.4rem]">
                    {day || "غير محدد"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]">
                    وقت البداية
                    {!isAdmin && (
                      <span className="mr-1 text-[11px] text-amber-600 sm:text-[1.2rem]">
                        (قراءة)
                      </span>
                    )}
                  </label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none sm:text-[1.4rem]"
                    />
                  ) : (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 sm:text-[1.4rem]">
                      {startTime || "غير محدد"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]">
                    وقت النهاية
                    {!isAdmin && (
                      <span className="mr-1 text-[11px] text-amber-600 sm:text-[1.2rem]">
                        (قراءة)
                      </span>
                    )}
                  </label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none sm:text-[1.4rem]"
                    />
                  ) : (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 sm:text-[1.4rem]">
                      {endTime || "غير محدد"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]">
                  حالة المحاضرة
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none sm:text-[1.4rem]"
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                  <option value="additional">إضافية</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:mt-4 sm:text-[1.4rem]">
                {formError}
              </p>
            )}

            <div className="mt-5 flex gap-3 sm:mt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-olive-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-olive-700 disabled:opacity-60 sm:text-[1.4rem]"
              >
                {isSubmitting ? "جاري الحفظ..." : "💾 حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 sm:text-[1.4rem]"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
