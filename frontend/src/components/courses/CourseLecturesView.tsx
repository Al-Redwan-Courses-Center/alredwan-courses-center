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
import { updateLecture } from "@/actions/lectures";

const { sortConfig, filterConfig, statusMap } = courseLecturesViewConfig;

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

  // ── RBAC ──────────────────────────────────────────────
  const isAdmin = userRole === "admin";
  const isInstructor = userRole === "instructor" || userRole === "teacher";
  const isStudentOrParent = userRole === "student" || userRole === "parent";

  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  // ── UI State ──────────────────────────────────────────
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [editingLecture, setEditingLecture] = useState<LectureListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
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

  // ── Handle Save ──────────────────────────────────────
  async function handleSave() {
    if (!editingLecture) return;
    setIsSubmitting(true);
    setFormError(null);

    const payload: Record<string, any> = {};
    const today = new Date().toISOString().split('T')[0];

    if (!isAdmin) {
      const dayChanged = day && day !== editingLecture.day;
      const startTimeChanged = startTime && startTime !== editingLecture.start_time?.slice(0, 5);
      const endTimeChanged = endTime && endTime !== editingLecture.end_time?.slice(0, 5);

      if (dayChanged || startTimeChanged || endTimeChanged) {
        setFormError("❌ يمكنك تعديل العنوان والحالة فقط. التاريخ والتوقيت للقراءة.");
        setIsSubmitting(false);
        return;
      }

      if (editingLecture.day < today) {
        payload.day = today;
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
      setFormError("⚠️ لم تقم بأي تغيير.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await updateLecture(editingLecture.id, payload);

      if (result.success) {
        toast.success("✅ تم تحديث المحاضرة بنجاح");
        closeEditModal();
        router.refresh();
      } else {
        setFormError(result.message || "حدث خطأ أثناء التحديث");
        toast.error(result.message || "❌ فشل التحديث");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
      toast.error("❌ حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Action Buttons (للجدول فقط) ─────────────────────
  function TableActionButtons({ lecture }: { lecture: LectureListItem }) {
    return (
      <div className="flex items-center justify-center gap-6 *:transition-colors *:text-olive-300 *:hover:text-olive-700">
        {canDelete && (
          <button type="button" title="حذف المحاضرة">
            <TrashIcon />
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            title="تعديل المحاضرة"
            onClick={() => openEditModal(lecture)}
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

  // ── Action Buttons (للكروت فقط) ──────────────────────
  function CardActionButtons({ lecture }: { lecture: LectureListItem }) {
    return (
      <div className="flex items-center justify-center gap-3 *:transition-colors *:text-olive-300 *:hover:text-olive-700">
        {canDelete && (
          <button type="button" title="حذف المحاضرة" className="p-1">
            <TrashIcon />
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            title="تعديل المحاضرة"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openEditModal(lecture);
            }}
            className="p-1"
          >
            <EditIcon />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── الحاوية الرئيسية ── */}
      <div className="relative w-full">
        <DataView
          data={lectures}
          maxItemsPerPage={5}
          sortConfig={sortConfig}
          filterConfig={filterConfig}
          gridLayout={cn(
            // ✅ التعديل: نفس التصميم القديم مع min-w للـ Responsive
            "min-w-[320px] grid-cols-[minmax(40px,0.5fr)_minmax(120px,2fr)_minmax(90px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)]",
            "md:grid-cols-[minmax(40px,0.5fr)_minmax(150px,2fr)_minmax(100px,1fr)_minmax(80px,1fr)_minmax(80px,1fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)]",
            "lg:min-w-[900px] lg:grid-cols-[minmax(40px,0.5fr)_minmax(180px,2.5fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)]"
          )}
        >
          {/* ── شريط البحث والفلترة ── */}
          <div className="relative z-10 mb-8 md:mb-14 flex w-full flex-col gap-4 transition-all duration-300 lg:flex-row lg:items-center lg:gap-32">
            <div className="flex w-full [&>div]:w-full [&_input]:w-full lg:w-auto lg:flex-1">
              <DataViewSearchLegacy
                isFocused={isSearchFocused}
                setIsFocused={setIsSearchFocused}
              />
            </div>
            <div
              className={cn(
                "flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 sm:flex-row lg:w-auto lg:gap-32",
                isSearchFocused
                  ? "pointer-events-none max-h-0 scale-95 opacity-0 lg:max-h-none lg:max-w-0"
                  : "max-h-[500px] scale-100 opacity-100 lg:max-h-none lg:max-w-[500px]"
              )}
            >
              <div className="w-full sm:w-auto">
                <DataViewSortLegacy />
              </div>
              <div className="w-full sm:w-auto">
                <DataViewFilterLegacy />
              </div>
            </div>
          </div>

          {/* ── الجسم: جدول + كروت ── */}
          <DataViewBodyLegacy
            header={
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
            }
            render={{
              table: (lecture: LectureListItem, i: number) => {
                const { label, color } = statusMap[lecture.status] || {
                  label: lecture.status,
                  color: "gray",
                };
                const weekday = getWeekDay(
                  parseISO(lecture.scheduled_at).getDay()
                );

                return (
                  <DataViewRowLegacy key={lecture.id} index={i}>
                    <DataViewCellLegacy className="whitespace-nowrap font-bold">
                      {toHindiDigits(i + 1)}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="min-w-[100px] whitespace-nowrap">
                      {lecture.title}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="whitespace-nowrap">
                      {formatDate(parseISO(lecture.scheduled_at))}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="whitespace-nowrap font-bold">
                      {weekday}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="whitespace-nowrap font-bold">
                      {formatTime(lecture.start_time)}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy className="whitespace-nowrap font-bold">
                      {formatTime(lecture.end_time)}
                    </DataViewCellLegacy>
                    <DataViewCellLegacy>
                      <StatusBadge color={color}>{label}</StatusBadge>
                    </DataViewCellLegacy>
                    <DataViewCellLegacy>
                      <TableActionButtons lecture={lecture} />
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
                  parseISO(lecture.scheduled_at).getDay()
                );
                const detailUrl = `/dashboard/my-courses/${course?.id}/lectures/${lecture.id}`;

                return (
                  <div
                    key={lecture.id}
                    className="w-[207px] h-[207px] rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
                  >
                    {/* الجزء العلوي: الرابط لصفحة التفاصيل */}
                    <Link
                      href={detailUrl}
                      className="flex-1 p-3 flex flex-col justify-between cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-olive-700 text-sm line-clamp-2">
                          {lecture.title}
                        </span>
                        <StatusBadge color={color} className="text-xs shrink-0">
                          {label}
                        </StatusBadge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span>التاريخ:</span>
                          <span>{formatDate(parseISO(lecture.scheduled_at))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>اليوم:</span>
                          <span>{weekday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>البداية:</span>
                          <span>{formatTime(lecture.start_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>النهاية:</span>
                          <span>{formatTime(lecture.end_time)}</span>
                        </div>
                      </div>
                    </Link>

                    {/* أزرار الإجراءات (خارج الرابط) */}
                    <div className="border-t border-gray-100 p-2 flex items-center justify-end gap-3">
                      <CardActionButtons lecture={lecture} />
                    </div>
                  </div>
                );
              },
            }}
          />

          <DataViewPaginationLegacy />
        </DataView>
      </div>

      {/* ── Edit Modal (مع z-index عالي) ── */}
      {canEdit && editingLecture && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 pointer-events-none"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto pointer-events-auto"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold text-olive-800">
              تعديل المحاضرة
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              {isAdmin
                ? "🔓 صلاحيات أدمن — يمكنك تعديل جميع الحقول"
                : "🔒 صلاحيات محاضر — يمكنك تعديل العنوان والحالة فقط. التاريخ والتوقيت للقراءة."}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  عنوان المحاضرة
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:outline-none focus:ring-1 focus:ring-olive-400"
                  placeholder="أدخل عنوان المحاضرة"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  تاريخ الانعقاد
                  {!isAdmin && (
                    <span className="mr-2 text-xs text-red-500">🔒 للقراءة فقط</span>
                  )}
                </label>
                {isAdmin ? (
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:outline-none focus:ring-1 focus:ring-olive-400"
                  />
                ) : (
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {day || "غير محدد"}
                    <span className="mr-2 text-xs text-gray-400">
                      {editingLecture?.day && editingLecture.day < new Date().toISOString().split('T')[0]
                        ? "(سيتم تحديثه تلقائياً لليوم الحالي)"
                        : "(لا يمكن التعديل)"}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    وقت البداية
                    {!isAdmin && (
                      <span className="mr-2 text-xs text-red-500">🔒 للقراءة فقط</span>
                    )}
                  </label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:outline-none focus:ring-1 focus:ring-olive-400"
                    />
                  ) : (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {startTime || "غير محدد"}
                      <span className="mr-2 text-xs text-gray-400">(لا يمكن التعديل)</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    وقت النهاية
                    {!isAdmin && (
                      <span className="mr-2 text-xs text-red-500">🔒 للقراءة فقط</span>
                    )}
                  </label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:outline-none focus:ring-1 focus:ring-olive-400"
                    />
                  ) : (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {endTime || "غير محدد"}
                      <span className="mr-2 text-xs text-gray-400">(لا يمكن التعديل)</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  حالة المحاضرة
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive-400 focus:outline-none focus:ring-1 focus:ring-olive-400"
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                  <option value="additional">إضافية</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-olive-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-700 disabled:opacity-60"
              >
                {isSubmitting ? "جاري الحفظ..." : "💾 حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
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