import { protect } from "@/actions/auth";
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
  notes?: string | null; // إضافة ملاحظات المحاضرة المباشرة
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

// معالجة صحيحة للوقت لتجنب ظهور "من إلى" فارغة
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
      className={`inline-flex items-center rounded-full border px-6 py-2 text-base font-bold sm:text-xl ${
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
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f0ea] text-3xl text-[#2f5d50] shadow-sm sm:h-20 sm:w-20 sm:text-4xl">
        {icon}
      </span>
      <p className="text-muted-foreground text-base font-semibold sm:text-lg">
        {label}
      </p>
      <p className="text-xl font-extrabold text-[#1a3c34] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export default async function LectureDetailPage({
  params,
  searchParams,
}: {
  params:
    | { courseId: string; lectureId: string }
    | Promise<{ courseId: string; lectureId: string }>;
  searchParams?: { child?: string } | Promise<{ child?: string }>;
}) {
  await protect(["student", "parent", "admin"]);

  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams ?? {});
  const { courseId, lectureId } = resolvedParams;
  const childId = resolvedSearch.child;

  let lecture = await getLectureForStudent(courseId, lectureId);
  if (!lecture && childId) {
    lecture = await getLectureForParent(courseId, lectureId, childId);
  }

  if (!lecture) {
    notFound();
  }

  const attendance = lecture.attendance_info;
  const noteContent = attendance?.notes || lecture.notes;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 sm:px-8" dir="rtl">
      {/* العودة */}
      <div className="flex justify-end">
        <Link
          href={`/dashboard/my-courses/${courseId}/lectures`}
          className="inline-flex items-center gap-3 rounded-2xl border-2 border-[#c5d9cc] bg-white px-7 py-3.5 text-lg font-bold text-[#2f5d50] shadow-md transition hover:bg-[#e8f0ea] sm:text-xl"
        >
          العودة إلى قائمة المحاضرات
        </Link>
      </div>

      {/* البطاقة الرئيسية */}
      <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#dce8e1] bg-white shadow-[0_15px_45px_rgb(0,0,0,0.06)]">
        {/* العنوان */}
        <div className="border-b-2 border-[#e8f0ea] px-8 py-12 text-center sm:px-16">
          <div className="mb-6 flex justify-center">
            <StatusPill
              status={lecture.status}
              label={lecture.status_display}
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#1a3c34] sm:text-5xl lg:text-6xl">
            {lecture.title || `محاضرة رقم ${lecture.lecture_number}`}
          </h1>
          <p className="text-muted-foreground mt-4 text-xl font-medium sm:text-2xl">
            محاضرة رقم {lecture.lecture_number} في الكورس
          </p>
        </div>

        {/* الملاحظات والمواعيد */}
        <div className="grid grid-cols-2 gap-8 border-b-2 border-[#e8f0ea] px-8 py-12 sm:grid-cols-4 sm:px-16">
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
        <div className="px-8 py-12 sm:px-16">
          <h2 className="mb-6 text-2xl font-black text-[#1a3c34] sm:text-3xl lg:text-4xl">
            حالة حضورك
          </h2>

          {attendance ? (
            <div className="flex flex-col gap-6 rounded-3xl border-2 border-[#dce8e1] bg-[#f7faf8] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="flex items-center gap-6">
                <div
                  className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl text-3xl font-black sm:h-20 sm:w-20 sm:text-4xl ${
                    attendance.present
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {attendance.present ? "✓" : "✗"}
                </div>
                <div>
                  <p
                    className={`text-2xl font-extrabold sm:text-3xl ${
                      attendance.present ? "text-emerald-800" : "text-red-700"
                    }`}
                  >
                    {attendance.present
                      ? "حضرت هذه المحاضرة"
                      : "لم تحضر هذه المحاضرة"}
                  </p>
                  {attendance.marked_at && (
                    <p className="text-muted-foreground mt-2 text-base sm:text-lg">
                      تم التسجيل:{" "}
                      {new Date(attendance.marked_at).toLocaleString("ar-EG")}
                    </p>
                  )}
                </div>
              </div>

              {attendance.rating != null && (
                <div className="rounded-2xl border-2 border-[#dce8e1] bg-white px-8 py-4 text-center shadow-md">
                  <p className="text-muted-foreground text-base font-medium sm:text-lg">
                    التقييم
                  </p>
                  <p className="text-3xl font-black text-[#2f5d50] sm:text-4xl">
                    {attendance.rating}
                    <span className="text-muted-foreground text-lg font-normal">
                      {" "}
                      / 10
                    </span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-[#c5d9cc] bg-[#f7faf8] px-8 py-14 text-center">
              <p className="text-2xl font-black text-[#2f5d50] sm:text-3xl lg:text-4xl">
                لم يتم تسجيل الحضور بعد
              </p>
              <p className="text-muted-foreground mt-3 text-lg sm:text-xl">
                سيظهر هنا حالة حضورك بمجرد ما المدرس يسجّل الحضور
              </p>
            </div>
          )}
        </div>

        {/* الملاحظات */}
        <div className="border-t-2 border-[#e8f0ea] px-8 py-12 sm:px-16">
          <h2 className="mb-2 text-2xl font-black text-[#1a3c34] sm:text-3xl lg:text-4xl">
            الملاحظات
          </h2>
          <p className="text-muted-foreground mb-6 text-lg sm:text-xl">
            الملاحظات المسجّلة على هذه المحاضرة
          </p>

          {noteContent ? (
            <div className="rounded-3xl border-2 border-amber-200 bg-amber-50/90 px-8 py-6 text-xl leading-relaxed font-medium text-amber-950 sm:text-2xl">
              {noteContent}
            </div>
          ) : (
            <div className="text-muted-foreground rounded-3xl border-2 border-dashed border-[#c5d9cc] bg-[#f7faf8] px-8 py-10 text-center text-lg font-semibold sm:text-xl">
              لا توجد ملاحظات مسجّلة على هذه المحاضرة حاليًا
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
