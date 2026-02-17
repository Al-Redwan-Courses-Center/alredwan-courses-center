import { getCourseById } from "@/actions/courses";
import { getInstructorEnrollmentsByCourseId } from "@/actions/enrollments";
import { getLecturesByCourseId } from "@/actions/lectures";
import AddLectureNotesInput from "@/components/attendance/AddLectureNotesInput";
import LectureAttendanceView from "@/components/attendance/LectureAttendanceView";
import ClockIcon from "@/components/icons/ClockIcon";
import CommentIcon from "@/components/icons/CommentIcon";
import Button from "@/components/ui/Button";
import { getLectureById } from "@/dev-data/db";
import { cn, formatTime, getWeekDay } from "@/lib/utils";
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
  params: Promise<{ lectureId: string; courseId: string }>;
}) {
  const { lectureId, courseId } = await params;
  // const { course, ...lecture } = getLectureById(+lectureId);
  const lecture = (await getLecturesByCourseId(courseId)).find(
    (lec) => lec.id === +lectureId,
  );
  const enrollments = (await getInstructorEnrollmentsByCourseId(courseId)).map(
    ({ participant_name, participant_type }) => ({
      participant_name,
      participant_type,
    }),
  );

  return (
    <div className="flex flex-col pt-4">
      <div className="ms-16 mb-14 grid h-76 w-6/10 grid-cols-[1fr_1fr_2fr] grid-rows-2 gap-x-20 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-36 shadow-inner">
        <div className="col-span-full flex items-center justify-between">
          <div className="flex flex-col pt-5">
            <span className="text-olive-300 text-xl font-bold">
              {enrollments[0].course_name}
            </span>
            <h2 className="text-olive-500 text-[4rem] font-bold">
              {lecture?.title}
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
        students={course.enrollments.map((e) => e.child ?? e.student) || []}
        attendances={lecture.attendances || []}
        courseId={courseId}
        lecture={lecture}
      />
    </div>
  );
}
