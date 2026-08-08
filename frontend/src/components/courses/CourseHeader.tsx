import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import CopyToClipboardButton from "@/components/ui/CopyToClipboardButton";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import { CourseDetail } from "@/types/entities";
import { parseISO } from "date-fns";

const dataPointWrapperStyles = cn(
  "flex flex-col items-center gap-1 text-center",
);

const dataPointIconStyles = cn("text-olive-400 mb-1 h-8 w-auto");

const labelStyles = cn("text-lg font-medium text-gray-400");
const valueStyles = cn("text-olive-700 text-xl font-bold");

export default function CourseHeader({
  course,
}: {
  course: CourseDetail | null;
}) {
  return (
    <div className="relative mb-12 w-full">
      {/* Background/Glass Container */}
      <div className="shadow-soft relative flex w-full flex-col items-center gap-8 overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md max-[1000px]:gap-6 max-[1000px]:p-6">
        {/* Course ID Badge */}
        <div className="absolute top-6 left-10 max-[1000px]:static max-[1000px]:self-end">
          <CopyToClipboardButton className="rounded-full border-none bg-white/80 px-4 py-1.5 text-lg shadow-sm hover:bg-white">
            {course?.slug || "C1389403"}
          </CopyToClipboardButton>
        </div>

        {/* Title Section */}
        <div className="mt-4 text-center">
          <h2 className="text-olive-700 font-medad text-5xl font-bold max-[1000px]:text-4xl">
            {course?.name} - مستوى متقدم
          </h2>
        </div>

        {/* Info Grid */}
        <div className="border-olive-100/50 grid w-full max-w-4xl grid-cols-4 gap-x-20 border-t pt-8 max-[1000px]:grid-cols-2 max-[1000px]:gap-x-4 max-[1000px]:gap-y-6">
          <div className={dataPointWrapperStyles}>
            <InstructorIcon className={dataPointIconStyles} />
            <span className={labelStyles}>المعلمين</span>
            <span className={valueStyles}>
              {course?.instructor?.name || "لا يوجد معلم"}
            </span>
          </div>

          <div className={dataPointWrapperStyles}>
            <CalendarIcon className={dataPointIconStyles} />
            <span className={labelStyles}>الموسم</span>
            <span className={valueStyles}>
              {course?.season?.name || "رمضان"}
            </span>
          </div>

          <div className={dataPointWrapperStyles}>
            <PeopleIcon className={dataPointIconStyles} />
            <span className={labelStyles}>الحصة</span>
            <span className={valueStyles}>
              {toHindiDigits(course?.capacity || 200)}
            </span>
          </div>

          <div className={dataPointWrapperStyles}>
            <ClockIcon className={dataPointIconStyles} />
            <span className={labelStyles}>المواعيد</span>
            <span className={valueStyles}>
              {course?.start_date
                ? formatDate(parseISO(course.start_date))
                : "من 12/9/2021 إلى 12/10/2021"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
