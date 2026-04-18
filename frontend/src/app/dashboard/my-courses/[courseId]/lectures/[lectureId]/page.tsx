import { getLectureAttendance } from "@/actions/attendances";
import { getLectureById } from "@/actions/lectures";
import AddLectureNotesInput from "@/components/attendance/AddLectureNotesInput";
import LectureAttendanceView from "@/components/attendance/LectureAttendanceView";
import ClockIcon from "@/components/icons/ClockIcon";
import CommentIcon from "@/components/icons/CommentIcon";
import CopyToClipboardButton from "@/components/ui/CopyToClipboardButton";
import { cn, formatTime } from "@/lib/utils";

const dataPointWrapperStyles = cn(
  "text-olive-300 grid grid-cols-[auto_1fr] grid-rows-2 gap-x-5 gap-y-2 text-xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-10 w-auto self-center",
);

export default async function Page({
  params,
}: {
  params: Promise<{ lectureId: string; courseId: string }>;
}) {
  const { lectureId, courseId } = await params;
  const [lecture, lectureAttendance] = await Promise.all([
    getLectureById(lectureId),
    getLectureAttendance(lectureId),
  ]);

  const { attendances } = lectureAttendance || {};
  const attendanceViewOptions = lectureAttendance
    ? {
        is_future_lecture: lectureAttendance.is_future_lecture,
        is_attendance_submittable: lectureAttendance.is_attendance_submittable,
        is_editable: lectureAttendance.is_editable,
        user_can_bypass_deadline: lectureAttendance.user_can_bypass_deadline,
        user_can_mark_future_lectures:
          lectureAttendance.user_can_mark_future_lectures,
      }
    : null;

  return (
    <div className="flex flex-col pt-4">
      <div className="ms-16 mb-14 grid h-76 w-6/10 grid-cols-[1fr_1fr_2fr] grid-rows-2 gap-x-20 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-36 shadow-inner">
        <div className="col-span-full flex items-center justify-between">
          <div className="flex flex-col pt-5">
            <span className="text-olive-300 text-xl font-bold">
              {lecture?.course.name}
            </span>
            <h2 className="text-olive-500 text-[4rem] font-bold">
              {lecture?.title}
            </h2>
          </div>

          {!!lecture?.id && lecture.id >= 0 && (
            <div className="flex items-center gap-7">
              <span className="text-olive-700 text-2xl font-bold">الكود</span>
              <CopyToClipboardButton>
                {String(lecture.id)}
              </CopyToClipboardButton>
            </div>
          )}
        </div>

        <div className={dataPointWrapperStyles}>
          <ClockIcon className={dataPointIconStyles} />
          <span className="self-end">المواعيد</span>
          <span className="text-olive-500">
            من {formatTime(lecture?.start_time)} إلي{" "}
            {formatTime(lecture?.end_time)}
          </span>
        </div>

        <div className={dataPointWrapperStyles}>
          <CommentIcon className={dataPointIconStyles} />
          <span className="self-end">الوصف</span>
          <span className="text-olive-500">محاضرة تمهيدية</span>
        </div>

        <div className="flex grow items-center justify-stretch">
          <AddLectureNotesInput />
        </div>
      </div>

      <LectureAttendanceView
        attendances={attendances || []}
        courseId={courseId}
        lecture={lecture}
        options={attendanceViewOptions}
      />
    </div>
  );
}
