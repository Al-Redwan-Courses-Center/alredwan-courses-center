import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import CopyToClipboardButton from "@/components/ui/CopyToClipboardButton";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import { CourseDetail } from "@/types/entities";
import { parseISO } from "date-fns";

const dataPointWrapperStyles = cn(
  "text-olive-300 grid grid-cols-[auto_1fr] grid-rows-2 gap-x-5 gap-y-2 text-xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-10 w-auto self-center",
);

export default function CourseHeader({
  course,
}: {
  course: CourseDetail | null;
}) {
  return (
    <div className="mb-14 grid h-76 w-6/10 grid-cols-[repeat(4,auto)] grid-rows-2 gap-x-20 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-36 shadow-inner">
      <div className="col-span-full flex items-center justify-between">
        <h2 className="text-olive-500 text-[4rem] font-bold">{course?.name}</h2>

        <CopyToClipboardButton>c1389403</CopyToClipboardButton>
      </div>

      <div className={dataPointWrapperStyles}>
        <InstructorIcon className={dataPointIconStyles} />
        <span className="self-end">
          المعلم{course?.instructor.name === "female" && "ة"}
        </span>
        <span className="text-olive-500">
          {/* الأخ{course?.instructor.gender === "female" && "ت"}{" "} */}
          الأخ {course?.instructor.name}
        </span>
      </div>

      <div className={dataPointWrapperStyles}>
        <CalendarIcon className={dataPointIconStyles} />
        <span className="self-end">الموسم</span>
        <span className="text-olive-500">{course?.season?.name}</span>
      </div>

      <div className={dataPointWrapperStyles}>
        <PeopleIcon className={dataPointIconStyles} />
        <span className="self-end">السعة</span>
        <span className="text-olive-500">
          {toHindiDigits(course?.capacity || 0)}
        </span>
      </div>

      <div className={dataPointWrapperStyles}>
        <ClockIcon className={dataPointIconStyles} />
        <span className="self-end">المواعيد</span>
        <span className="text-olive-500">
          <span>{!!course?.end_date ? "من" : "يبدأ"}</span>{" "}
          <span className="font-bold">
            {formatDate(parseISO(course?.start_date || ""))}
          </span>{" "}
          {!!course?.end_date && (
            <>
              <span>إلى</span>{" "}
              <span className="font-bold">
                {formatDate(parseISO(course?.end_date || ""))}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
