"use client";

import { parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { updateLecture } from "@/actions/lectures";
import type { LectureListItem } from "@/types/entities";

interface LectureUpdatePayload {
  title?: string;
  status?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
}

const inputStyles =
  "focus:border-olive-400 focus:ring-olive-400 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:outline-none sm:text-[1.4rem]";

const readOnlyStyles =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 sm:text-[1.4rem]";

function toDayInputValue(lecture: LectureListItem) {
  try {
    return parseISO(lecture.scheduled_at).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/**
 * Edits a lecture's title/status (any editor) and its day/times (admin only —
 * the backend rejects those fields for instructors, so they are shown read-only).
 * Mount it only while open; it initialises its fields from `lecture` on mount.
 */
export default function LectureEditModal({
  lecture,
  isAdmin,
  onClose,
  onSaved,
}: {
  lecture: LectureListItem;
  isAdmin: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState(lecture.title || "");
  const [day, setDay] = useState(() => toDayInputValue(lecture));
  const [startTime, setStartTime] = useState(
    lecture.start_time?.slice(0, 5) || "",
  );
  const [endTime, setEndTime] = useState(lecture.end_time?.slice(0, 5) || "");
  const [status, setStatus] = useState<string>(lecture.status || "scheduled");

  async function handleSave() {
    setIsSubmitting(true);
    setFormError(null);

    const payload: LectureUpdatePayload = {};

    if (!isAdmin) {
      if (day && day !== lecture.day) {
        setFormError("غير مسموح لك بتعديل تاريخ المحاضرة.");
        setIsSubmitting(false);
        return;
      }
      if (startTime && startTime !== lecture.start_time?.slice(0, 5)) {
        setFormError("غير مسموح لك بتعديل وقت البداية.");
        setIsSubmitting(false);
        return;
      }
      if (endTime && endTime !== lecture.end_time?.slice(0, 5)) {
        setFormError("غير مسموح لك بتعديل وقت النهاية.");
        setIsSubmitting(false);
        return;
      }
    }

    if (title.trim() && title.trim() !== lecture.title) {
      payload.title = title.trim();
    }

    if (status && status !== lecture.status) {
      payload.status = status;
    }

    if (isAdmin) {
      if (day && day !== lecture.day) {
        payload.day = day;
      }
      if (startTime && startTime !== lecture.start_time?.slice(0, 5)) {
        payload.start_time = `${startTime}:00`;
      }
      if (endTime && endTime !== lecture.end_time?.slice(0, 5)) {
        payload.end_time = `${endTime}:00`;
      }
    }

    if (Object.keys(payload).length === 0) {
      setFormError("لم تقم بأي تغيير.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await updateLecture(lecture.id, payload);

      if (result.success) {
        toast.success("تم تحديث المحاضرة بنجاح");
        onClose();
        onSaved?.();
      } else {
        toast.error(result.message || "فشل التحديث");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 [-webkit-backdrop-filter:blur(2px)] sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lecture-edit-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="lecture-edit-title"
          className="font-medad text-olive-800 mb-1 text-lg font-bold sm:text-[2rem]"
        >
          تعديل المحاضرة
        </h2>
        <p className="mb-4 text-xs text-gray-500 sm:mb-5 sm:text-[1.4rem]">
          {isAdmin
            ? "🔓 صلاحيات أدمن — يمكنك تعديل كافة حقول المحاضرة"
            : "🔒 صلاحيات محاضر — يمكنك تعديل العنوان وحالة المحاضرة فقط"}
        </p>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label
              htmlFor="lecture-edit-title-input"
              className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]"
            >
              عنوان المحاضرة
            </label>
            <input
              id="lecture-edit-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyles}
              placeholder="أدخل عنوان المحاضرة"
            />
          </div>

          <div>
            <label
              htmlFor="lecture-edit-day"
              className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]"
            >
              تاريخ الانعقاد
              {!isAdmin && (
                <span className="mr-2 text-xs font-semibold text-amber-600 sm:text-[1.2rem]">
                  (للقراءة فقط)
                </span>
              )}
            </label>
            {isAdmin ? (
              <input
                id="lecture-edit-day"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={inputStyles}
              />
            ) : (
              <div className={readOnlyStyles}>{day || "غير محدد"}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lecture-edit-start"
                className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]"
              >
                وقت البداية
                {!isAdmin && (
                  <span className="mr-1 text-[11px] text-amber-600 sm:text-[1.2rem]">
                    (قراءة)
                  </span>
                )}
              </label>
              {isAdmin ? (
                <input
                  id="lecture-edit-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputStyles}
                />
              ) : (
                <div className={readOnlyStyles}>{startTime || "غير محدد"}</div>
              )}
            </div>
            <div>
              <label
                htmlFor="lecture-edit-end"
                className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]"
              >
                وقت النهاية
                {!isAdmin && (
                  <span className="mr-1 text-[11px] text-amber-600 sm:text-[1.2rem]">
                    (قراءة)
                  </span>
                )}
              </label>
              {isAdmin ? (
                <input
                  id="lecture-edit-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputStyles}
                />
              ) : (
                <div className={readOnlyStyles}>{endTime || "غير محدد"}</div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="lecture-edit-status"
              className="mb-1 block text-xs font-medium text-gray-700 sm:text-[1.4rem]"
            >
              حالة المحاضرة
            </label>
            <select
              id="lecture-edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputStyles} bg-white`}
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
            className="bg-olive-600 hover:bg-olive-700 flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60 sm:text-[1.4rem]"
          >
            {isSubmitting ? "جاري الحفظ..." : "💾 حفظ التعديلات"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 sm:text-[1.4rem]"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
