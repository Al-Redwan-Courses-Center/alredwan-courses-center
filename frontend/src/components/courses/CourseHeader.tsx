import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import CopyToClipboardButton from "@/components/ui/CopyToClipboardButton";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import { CourseDetail } from "@/types/entities";
import { parseISO } from "date-fns";

const dataPointWrapperStyles = cn(
  "flex flex-col items-center gap-1 text-center"
);

const dataPointIconStyles = cn(
  "h-8 w-auto text-olive-400 mb-1"
);

const labelStyles = cn("text-gray-400 text-lg font-medium");
const valueStyles = cn("text-olive-700 text-xl font-bold");

export default function CourseHeader({
  course,
}: {
  course: CourseDetail | null;
}) {
  return (
    <div className="mb-12 relative w-full">
      {/* Background/Glass Container */}
      <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-soft p-6 min-[1000px]:p-10 flex flex-col items-center gap-8 relative overflow-hidden w-full">
        
        {/* Course ID Badge */}
        <div className="absolute top-4 left-4 min-[1000px]:top-6 min-[1000px]:left-10">
          <CopyToClipboardButton className="bg-white/80 hover:bg-white shadow-sm border-none px-3 py-1 min-[1000px]:px-4 min-[1000px]:py-1.5 rounded-full text-base min-[1000px]:text-lg">
            {course?.slug || "C1389403"}
          </CopyToClipboardButton>
        </div>
        <div className="text-center mt-8 min-[1000px]:mt-4">
          <h2 className="text-olive-700 text-3xl min-[1000px]:text-5xl font-medad font-bold">
            {course?.name} - مستوى متقدم
          </h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 min-[1000px]:grid-cols-4 gap-y-8 gap-x-4 min-[1000px]:gap-x-20 w-full max-w-4xl border-t border-olive-100/50 pt-8">
          <div className={dataPointWrapperStyles}>
            <InstructorIcon className={dataPointIconStyles} />
            <span className={labelStyles}>المعلمين</span>
            <span className={valueStyles}>{course?.instructor.name}</span>
          </div>

          <div className={dataPointWrapperStyles}>
            <CalendarIcon className={dataPointIconStyles} />
            <span className={labelStyles}>الموسم</span>
            <span className={valueStyles}>{course?.season?.name || "رمضان"}</span>
          </div>

          <div className={dataPointWrapperStyles}>
            <PeopleIcon className={dataPointIconStyles} />
            <span className={labelStyles}>الحصة</span>
            <span className={valueStyles}>{toHindiDigits(course?.capacity || 200)}</span>
          </div>

          <div className={dataPointWrapperStyles}>
            <ClockIcon className={dataPointIconStyles} />
            <span className={labelStyles}>المواعيد</span>
            <span className={valueStyles}>
              {course?.start_date ? formatDate(parseISO(course.start_date)) : "من 12/9/2021 إلى 12/10/2021"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
