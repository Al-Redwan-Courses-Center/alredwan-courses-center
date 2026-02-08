import AddLectureNotesInput from "@/components/attendance/AddLectureNotesInput";
import LectureAttendanceView from "@/components/attendance/LectureAttendanceView";
import ClockIcon from "@/components/icons/ClockIcon";
import CommentIcon from "@/components/icons/CommentIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getLectureById } from "@/dev-data/db";
import { cn, formatTime, getWeekDay } from "@/lib/utils";
import { Lecture } from "@/types/entities";
import { parseISO } from "date-fns";

const dataPointWrapperStyles = cn(
  "text-olive-300 grid grid-cols-[auto_1fr] grid-rows-2 gap-x-5 gap-y-2 text-xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-10 w-auto self-center",
);

export default async function Page({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const { lectureId } = await params;
  const { course, ...lecture } = getLectureById(+lectureId) as Lecture;
  const weekday = getWeekDay(parseISO(lecture.date).getDay());
  const { start: startHour, end: endHour } =
    course.schedule.find((s) => s.day === weekday) || {};

  return (
    <div className="flex flex-col pt-4">
      <div className="ms-16 mb-14 grid h-76 w-6/10 grid-cols-[1fr_1fr_2fr] grid-rows-2 gap-x-20 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-36 shadow-inner">
        <div className="col-span-full flex items-center justify-between">
          <div className="flex flex-col pt-5">
            <span className="text-olive-300 text-xl font-bold">
              {course?.title}
            </span>
            <h2 className="text-olive-500 text-[4rem] font-bold">
              {lecture.title}
            </h2>
          </div>

          <Button variant="light" size="small" className="cursor-default!">
            c1389403
          </Button>
        </div>

        <div className={dataPointWrapperStyles}>
          <ClockIcon className={dataPointIconStyles} />
          <span className="self-end">المواعيد</span>
          <span className="text-olive-500">
            من {formatTime(startHour)} إلي {formatTime(endHour)}
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
        students={course.enrollments.map((e) => e.child ?? e.student) || []}
        attendances={lecture.attendances || []}
        courseId={String(course.id)}
        lecture={{ ...lecture, course }}
      />
    </div>
  );
}
