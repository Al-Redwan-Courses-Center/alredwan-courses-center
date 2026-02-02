import CourseLecturesView from "@/components/courses/CourseLecturesView";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import Button from "@/components/ui/Button";
import { getCourse } from "@/lib/courses";
import { cn, toHindiDigits } from "@/lib/utils";
import { Lecture } from "@/types/entities";

const dataPointWrapperStyles = cn(
  "text-olive-300 grid grid-cols-[auto_1fr] grid-rows-2 gap-x-5 gap-y-2 text-2xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-15 w-auto self-center",
);

export default async function page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await getCourse(+id);

  if (
    !course ||
    !course.instructor ||
    !course.tags ||
    !course.instructor.user ||
    !course.lectures
  )
    return null;

  return (
    <div className="flex flex-col px-16 pt-4">
      {/*
      //
      // MARK: Header
      //
      */}
      <div className="mb-14 grid h-76 w-6/10 grid-cols-[repeat(4,auto)] grid-rows-2 gap-x-20 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-36 pb-10 shadow-inner">
        <div className="col-span-full flex items-center justify-between">
          <h2 className="text-olive-500 text-[4rem] font-bold">
            {course?.name}
          </h2>

          <Button variant="light" size="small" className="cursor-default!">
            c1389403
          </Button>
        </div>

        <div className={dataPointWrapperStyles}>
          <InstructorIcon className={dataPointIconStyles} />
          <span className="self-end">
            المعلم{course.instructor.user.gender === "female" && "ة"}
          </span>
          <span className="text-olive-500">
            الأخ{course.instructor.user.gender === "female" && "ت"}{" "}
            {course.instructor.user.first_name}
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
            من {course?.start_date} <br /> إلى {course?.end_date}
          </span>
        </div>
      </div>

      <CourseLecturesView lectures={course.lectures as Lecture[]} />
    </div>
  );
}
