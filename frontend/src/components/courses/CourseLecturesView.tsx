"use client";

import { useState } from "react";
import { parseISO } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import courseLecturesViewConfig from "@/components/courses/course-lectures-view.config";
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
import {
  cn,
  formatDate,
  formatTime,
  getWeekDay,
  toHindiDigits,
} from "@/lib/utils";
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
}: {
  lectures: LectureListItem[];
  course: CourseDetail | null;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  const isAdmin = userRole === "admin";
  const isInstructor = userRole === "instructor" || userRole === "teacher";

  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

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
    lecture: LectureListItem;
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

        <Link
          href={`/dashboard/my-courses/${course?.id}/lectures/${lecture.id}`}
          title="عرض التفاصيل"
        >
          <InfoIcon />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full" dir="rtl">
        <DataView
          data={lectures}
          maxItemsPerPage={5}
          sortConfig={sortConfig}
          filterConfig={filterConfig}
          gridLayout={cn(
            "grid-cols-[minmax(40px,0.5fr)_minmax(120px,2fr)_minmax(90px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)]",
          )}
        >
          {/* Controls Bar matching InstructorMyCoursesView */}
          <div className="mb-14 flex items-center gap-32 ps-16">
            <DataViewSearch />
            <DataViewSort />
            <DataViewFilter />
            <DataViewLayoutToggle />
          </div>

          <DataViewHeaderLegacy className="mx-16">
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
            className="px-16"
            render={{
              table: (lecture: LectureListItem, i: number) => {
                const { label, color } = statusMap[lecture.status] || {
                  label: lecture.status,
                  color: "gray",
                };
                const weekday = getWeekDay(
                  parseISO(lecture.scheduled_at).getDay(),
                );

                return (
                  <DataViewRowLegacy key={lecture.id} index={i}>
                    <DataViewCellLegacy className="font-bold whitespace-nowrap">
                      {toHindiDigits(i + 1)}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="min-w-[100px] whitespace-nowrap">
                      {lecture.title}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="whitespace-nowrap">
                      {formatDate(parseISO(lecture.scheduled_at))}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="font-bold whitespace-nowrap">
                      {weekday}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="font-bold whitespace-nowrap">
                      {formatTime(lecture.start_time)}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="font-bold whitespace-nowrap">
                      {formatTime(lecture.end_time)}
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

              cards: (lecture: LectureListItem, i: number) => {
                const { label, color } = statusMap[lecture.status] || {
                  label: lecture.status,
                  color: "gray",
                };
                const weekday = getWeekDay(
                  parseISO(lecture.scheduled_at).getDay(),
                );
                const detailUrl = `/dashboard/my-courses/${course?.id}/lectures/${lecture.id}`;

                return (
                  <div
                    key={lecture.id}
                    className="flex h-[207px] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <Link
                      href={detailUrl}
                      className="flex min-w-0 flex-1 cursor-pointer flex-col justify-between p-3"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-1">
                        <span className="line-clamp-2 truncate text-[1.5rem] font-semibold text-olive-700">
                          {lecture.title}
                        </span>
                        <StatusBadge
                          color={color}
                          className="shrink-0 text-[1.2rem]"
                        >
                          {label}
                        </StatusBadge>
                      </div>
                      <div className="mt-2 min-w-0 space-y-1 text-[1.3rem] text-gray-600">
                        <div className="flex min-w-0 justify-between gap-2">
                          <span className="shrink-0">التاريخ:</span>
                          <span className="truncate text-left">
                            {formatDate(parseISO(lecture.scheduled_at))}
                          </span>
                        </div>
                        <div className="flex min-w-0 justify-between gap-2">
                          <span className="shrink-0">اليوم:</span>
                          <span className="truncate text-left">{weekday}</span>
                        </div>
                        <div className="flex min-w-0 justify-between gap-2">
                          <span className="shrink-0">البداية:</span>
                          <span className="truncate text-left">
                            {formatTime(lecture.start_time)}
                          </span>
                        </div>
                        <div className="flex min-w-0 justify-between gap-2">
                          <span className="shrink-0">النهاية:</span>
                          <span className="truncate text-left">
                            {formatTime(lecture.end_time)}
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

          <DataViewPaginationLegacy />
        </DataView>
      </div>

      {/* Edit Modal */}
      {canEdit && editingLecture && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 [-webkit-backdrop-filter:blur(2px)]"
          onClick={closeEditModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-medad mb-1 text-[2rem] font-bold text-olive-800">
              تعديل المحاضرة
            </h2>
            <p className="mb-5 text-[1.4rem] text-gray-500">
              {isAdmin
                ? "🔓 صلاحيات أدمن — يمكنك تعديل كافة حقول المحاضرة"
                : "🔒 صلاحيات محاضر — يمكنك تعديل العنوان وحالة المحاضرة فقط"}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[1.4rem] font-medium text-gray-700">
                  عنوان المحاضرة
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[1.4rem] focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none"
                  placeholder="أدخل عنوان المحاضرة"
                />
              </div>

              <div>
                <label className="mb-1 block text-[1.4rem] font-medium text-gray-700">
                  تاريخ الانعقاد
                  {!isAdmin && (
                    <span className="mr-2 text-[1.2rem] font-semibold text-amber-600">
                      (للقراءة فقط)
                    </span>
                  )}
                </label>
                {isAdmin ? (
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[1.4rem] focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none"
                  />
                ) : (
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[1.4rem] text-gray-600">
                    {day || "غير محدد"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[1.4rem] font-medium text-gray-700">
                    وقت البداية
                    {!isAdmin && (
                      <span className="mr-1 text-[1.2rem] text-amber-600">
                        (قراءة)
                      </span>
                    )}
                  </label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[1.4rem] focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none"
                    />
                  ) : (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[1.4rem] text-gray-600">
                      {startTime || "غير محدد"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[1.4rem] font-medium text-gray-700">
                    وقت النهاية
                    {!isAdmin && (
                      <span className="mr-1 text-[1.2rem] text-amber-600">
                        (قراءة)
                      </span>
                    )}
                  </label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[1.4rem] focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none"
                    />
                  ) : (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[1.4rem] text-gray-600">
                      {endTime || "غير محدد"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[1.4rem] font-medium text-gray-700">
                  حالة المحاضرة
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[1.4rem] focus:border-olive-400 focus:ring-1 focus:ring-olive-400 focus:outline-none"
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                  <option value="additional">إضافية</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[1.4rem] font-medium text-red-700">
                {formError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-olive-600 px-4 py-2.5 text-[1.4rem] font-semibold text-white shadow-sm transition hover:bg-olive-700 disabled:opacity-60"
              >
                {isSubmitting ? "جاري الحفظ..." : "💾 حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-[1.4rem] font-medium text-gray-600 transition hover:bg-gray-50"
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
