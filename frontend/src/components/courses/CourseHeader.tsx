import { parseISO } from "date-fns";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import CopyToClipboardButton from "@/components/ui/CopyToClipboardButton";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import type { CourseDetail } from "@/types/entities";

const dataPointWrapperStyles = cn(
  "flex flex-col items-center gap-1 text-center",
);

const dataPointIconStyles = cn("h-8 w-auto text-olive-400 mb-1");

const labelStyles = cn("text-gray-400 text-lg font-medium");
const valueStyles = cn("text-olive-700 text-xl font-bold");

export default function CourseHeader({
  course,
}: {
  course: CourseDetail | null;
}) {
  return (
    <div className="relative mb-6 w-full sm:mb-12">
      {/* Background/Glass Container */}
      <div className="shadow-soft relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-md max-[1000px]:gap-6 max-[1000px]:p-4 sm:gap-8 sm:rounded-[2.5rem] sm:p-10">
        {/* Course ID Badge */}
        <div className="self-end sm:absolute sm:top-6 sm:left-10 sm:self-auto">
          <CopyToClipboardButton className="border-none bg-white/80 px-3 py-1 text-xs shadow-sm hover:bg-white sm:px-4 sm:py-1.5 sm:text-lg">
            {course?.slug || "C1389403"}
          </CopyToClipboardButton>
        </div>

        {/* Title Section */}
        <div className="mt-2 text-center sm:mt-4">
          <h2 className="font-medad text-xl font-bold text-olive-700 max-[1000px]:text-2xl sm:text-5xl">
            {course?.name} - مستوى متقدم
          </h2>
        </div>

        {/* Info Grid */}
        <div className="grid w-full max-w-4xl grid-cols-2 gap-4 border-t border-olive-100/50 pt-4 sm:grid-cols-4 sm:gap-6 sm:pt-8 md:gap-x-20">
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
