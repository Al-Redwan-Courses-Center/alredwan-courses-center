import { getUser, protect } from "@/actions/auth";
import { getParentChildren } from "@/actions/user";
import { getAuthApiClient } from "@/lib/auth-api";
import { notFound } from "next/navigation";
import Link from "next/link";

interface AttendanceInfo {
  present: boolean;
  rating: number | null;
  notes: string | null;
  marked_at: string | null;
}

interface LectureFromList {
  id: number;
  lecture_number: number;
  title: string;
  day: string;
  scheduled_at: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  status_display: string;
  is_accepted: boolean;
  attendance_info: AttendanceInfo | null;
  notes?: string | null;
}

async function getLectureForStudent(
  courseId: string,
  lectureId: string,
): Promise<LectureFromList | null> {
  try {
    const api = await getAuthApiClient();
    const res = await api.get(`/api/courses/${courseId}/student/lectures/`);
    const lectures: LectureFromList[] = Array.isArray(res.data)
      ? res.data
      : (res.data?.results ?? []);
    return lectures.find((l) => String(l.id) === String(lectureId)) ?? null;
  } catch {
    return null;
  }
}

async function getLectureForParent(
  courseId: string,
  lectureId: string,
  childId: string,
): Promise<LectureFromList | null> {
  try {
    const api = await getAuthApiClient();
    const res = await api.get(
      `/api/courses/${courseId}/parent/${childId}/lectures/`,
    );
    const lectures: LectureFromList[] = Array.isArray(res.data)
      ? res.data
      : (res.data?.results ?? []);
    return lectures.find((l) => String(l.id) === String(lectureId)) ?? null;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "غير محدد";
  try {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatLectureTime(start: string | null, end: string | null): string {
  if (!start && !end) return "غير محدد";

  const formatSingle = (t: string | null) => {
    if (!t) return "";
    const parts = t.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
  };

  const startTime = formatSingle(start);
  const endTime = formatSingle(end);

  if (startTime && endTime) return `من ${startTime} إلى ${endTime}`;
  if (startTime) return `من ${startTime}`;
  if (endTime) return `إلى ${endTime}`;
  return "غير محدد";
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-[#e8f0ea] text-[#2f5d50] border-[#c5d9cc]",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    additional: "bg-violet-50 text-violet-800 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold sm:px-6 sm:py-2 sm:text-xl ${
        styles[status] || styles.scheduled
      }`}
    >
      {label}
    </span>
  );
}

function MetaItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 text-right sm:flex-col sm:items-center sm:gap-3 sm:text-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ea] text-xl text-[#2f5d50] shadow-sm sm:h-20 sm:w-20 sm:rounded-2xl sm:text-4xl">
        {icon}
      </span>
      <div className="min-w-0 flex-1 sm:w-full">
        <p className="text-muted-foreground text-xs font-semibold sm:text-lg">
          {label}
        </p>
        <p className="break-words text-sm font-extrabold text-[#1a3c34] sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function LectureDetailPageView({
  courseId,
  lectureId,
  childId,
}: {
  courseId: string;
  lectureId: string;
  childId?: string;
}) {
  await protect(["student", "parent", "admin"]);

  const user = await getUser();
  let activeChildId = childId;

  let lecture: LectureFromList | null = null;
  if (user?.role === "parent") {
    if (!activeChildId) {
      const children = await getParentChildren();
      activeChildId = children[0]?.id;
    }
    if (activeChildId) {
      lecture = await getLectureForParent(courseId, lectureId, activeChildId);
    }
  } else {
    lecture = await getLectureForStudent(courseId, lectureId);
    if (!lecture && activeChildId) {
      lecture = await getLectureForParent(courseId, lectureId, activeChildId);
    }
  }

  if (!lecture) {
    notFound();
  }

  const attendance = lecture.attendance_info;
  const noteContent = attendance?.notes || lecture.notes;
  const backHref = activeChildId
    ? `/dashboard/my-children/${activeChildId}/courses/${courseId}`
    : `/dashboard/my-courses/${courseId}`;

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-4 px-3 pb-16 sm:space-y-10 sm:px-8 sm:pb-24" dir="rtl">
      {/* العودة */}
      <div className="flex justify-start">
        <Link
          href={backHref}
          className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl border-2 border-[#c5d9cc] bg-white px-3.5 py-2 text-xs font-bold text-[#2f5d50] shadow-md transition hover:bg-[#e8f0ea] sm:rounded-2xl sm:gap-3 sm:px-7 sm:py-3.5 sm:text-xl"
        >
          <span>العودة إلى قائمة المحاضرات</span>
        </Link>
      </div>

      {/* البطاقة الرئيسية */}
      <div className="w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#dce8e1] bg-white shadow-[0_15px_45px_rgb(0,0,0,0.06)] sm:rounded-[2.5rem]">
        {/* العنوان */}
        <div className="border-b-2 border-[#e8f0ea] px-3 py-6 text-center sm:px-16 sm:py-12">
          <div className="mb-3 flex justify-center sm:mb-6">
            <StatusPill
              status={lecture.status}
              label={lecture.status_display}
            />
          </div>
          <h1 className="break-words text-xl font-black tracking-tight text-[#1a3c34] sm:text-5xl lg:text-6xl">
            {lecture.title || `محاضرة رقم ${lecture.lecture_number}`}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-xs font-medium sm:mt-4 sm:text-2xl">
            محاضرة رقم {lecture.lecture_number} في الكورس
          </p>
        </div>

        {/* الملاحظات والمواعيد */}
        <div className="grid grid-cols-1 gap-4 border-b-2 border-[#e8f0ea] px-3 py-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8 sm:px-16 sm:py-12">
          <MetaItem icon="📅" label="التاريخ" value={formatDate(lecture.day)} />
          <MetaItem
            icon="🕐"
            label="المواعيد"
            value={formatLectureTime(lecture.start_time, lecture.end_time)}
          />
          <MetaItem
            icon="#️⃣"
            label="رقم المحاضرة"
            value={String(lecture.lecture_number)}
          />
          <MetaItem
            icon="✅"
            label="حالة القبول"
            value={lecture.is_accepted ? "مقبولة" : "قيد المراجعة"}
          />
        </div>

        {/* الحضور */}
        <div className="px-3 py-6 sm:px-16 sm:py-12">
          <h2 className="mb-3 text-lg font-black text-[#1a3c34] sm:mb-6 sm:text-3xl lg:text-4xl">
            حالة حضورك
          </h2>

          {attendance ? (
            <div className="flex flex-col gap-4 rounded-xl border-2 border-[#dce8e1] bg-[#f7faf8] p-3.5 sm:gap-6 sm:rounded-3xl sm:p-10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black sm:h-20 sm:w-20 sm:rounded-2xl sm:text-4xl ${
                    attendance.present
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {attendance.present ? "✓" : "✗"}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-base font-extrabold sm:text-3xl ${
                      attendance.present ? "text-emerald-800" : "text-red-700"
                    }`}
                  >
                    {attendance.present
                      ? "حضرت هذه المحاضرة"
                      : "لم تحضر هذه المحاضرة"}
                  </p>
                  {attendance.marked_at && (
                    <p className="text-muted-foreground mt-1 text-[11px] sm:mt-2 sm:text-lg">
                      تم التسجيل:{" "}
                      {new Date(attendance.marked_at).toLocaleString("ar-EG")}
                    </p>
                  )}
                </div>
              </div>

              {attendance.rating != null && (
                <div className="w-full rounded-xl border-2 border-[#dce8e1] bg-white px-4 py-2.5 text-center shadow-md sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4">
                  <p className="text-muted-foreground text-[11px] font-medium sm:text-lg">
                    التقييم
                  </p>
                  <p className="text-xl font-black text-[#2f5d50] sm:text-4xl">
                    {attendance.rating}
                    <span className="text-muted-foreground text-xs font-normal sm:text-lg">
                      {" "}
                      / 10
                    </span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[#c5d9cc] bg-[#f7faf8] px-3 py-6 sm:rounded-3xl sm:px-8 sm:py-14 text-center">
              <p className="text-base font-black text-[#2f5d50] sm:text-3xl lg:text-4xl">
                لم يتم تسجيل الحضور بعد
              </p>
              <p className="text-muted-foreground mt-1 text-xs sm:mt-3 sm:text-xl">
                سيظهر هنا حالة حضورك بمجرد ما المدرس يسجّل الحضور
              </p>
            </div>
          )}
        </div>

        {/* الملاحظات */}
        <div className="border-t-2 border-[#e8f0ea] px-3 py-6 sm:px-16 sm:py-12">
          <h2 className="mb-1 text-lg font-black text-[#1a3c34] sm:mb-2 sm:text-3xl lg:text-4xl">
            الملاحظات
          </h2>
          <p className="text-muted-foreground mb-3 text-xs sm:mb-6 sm:text-xl">
            الملاحظات المسجّلة على هذه المحاضرة
          </p>

          {noteContent ? (
            <div className="break-words rounded-xl border-2 border-amber-200 bg-amber-50/90 px-3.5 py-3 text-sm font-medium leading-relaxed text-amber-950 sm:rounded-3xl sm:px-8 sm:py-6 sm:text-2xl">
              {noteContent}
            </div>
          ) : (
            <div className="text-muted-foreground rounded-xl border-2 border-dashed border-[#c5d9cc] bg-[#f7faf8] px-3 py-5 text-center text-xs font-semibold sm:rounded-3xl sm:px-8 sm:py-10 sm:text-xl">
              لا توجد ملاحظات مسجّلة على هذه المحاضرة حاليًا
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
