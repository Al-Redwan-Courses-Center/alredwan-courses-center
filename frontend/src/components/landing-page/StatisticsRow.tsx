import CheckIcon from "@/components/icons/CheckIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { statistics as statisticsApi, Statistics } from "@/dev-data/statistics";
import { cn, toHindiDigits } from "@/lib/utils";

const cardStyles = cn(
  "bg-olive-300 [&>svg]:drop-shadow-primary flex flex-col items-center justify-center py-10 shadow-inner [&>svg]:mb-5",
);
const straight = cn("rounded-tl-[10rem] rounded-br-[10rem]");
const reversed = cn("rounded-tr-[10rem] rounded-bl-[10rem]");

export default async function StatisticsRow() {
  const {
    data: { statistics },
  }: { status: string; data: { statistics: Statistics } } = await new Promise(
    (resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "success",
            data: {
              statistics: statisticsApi,
            },
          }),
        1500,
      ),
  );

  return (
    <div className="text-shadow-primary tablet:grid-cols-2 grid w-full grid-cols-4 gap-13 text-gray-100">
      <div className={cn(cardStyles, straight)}>
        <PeopleIcon />

        <span className="font-medad text-[4.2rem]">
          {toHindiDigits(statistics.studentCount)}
        </span>

        <span className="text-5xl">طالب مسجل</span>
      </div>

      <div className={cn(cardStyles, reversed)}>
        <InstructorIcon />

        <span className="font-medad text-[4.2rem]">
          {toHindiDigits(statistics.instructorCount)}
        </span>

        <span className="text-5xl">معلم ماهر</span>
      </div>

      <div className={cn(cardStyles, straight)}>
        <ClockIcon />

        <span className="font-medad text-[4.2rem]">
          {toHindiDigits(statistics.activeCourseCount)}
        </span>

        <span className="text-5xl">دورة نشطة</span>
      </div>

      <div className={cn(cardStyles, reversed)}>
        <CheckIcon />

        <span className="font-medad text-[4.2rem]">
          {toHindiDigits(statistics.completeCourseCount)}
        </span>

        <span className="text-5xl">دورة مكتملة</span>
      </div>
    </div>
  );
}
