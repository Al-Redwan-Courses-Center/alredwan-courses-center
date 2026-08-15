import { parseISO } from "date-fns";
import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import type { CourseDetail } from "@/types/entities";

export default function StudentCourseCard({
  course,
  index,
}: {
  course: CourseDetail & { course_progress: number };
  index: number;
}) {
  return (
    <ItemCard
      index={index}
      cardHeader={
        <div>
          <Image
            src={course.image || CourseImage}
            alt="Course Image"
            fill
            className="object-cover"
          />
        </div>
      }
      cardFooter={
        <div
          className={cn(
            "flex items-center",
            index % 2 === 0 ? "justify-end" : "",
          )}
        >
          <Button size="small" href={`/dashboard/my-courses/${course.id}/`}>
            عرض الدورة
          </Button>
        </div>
      }
    >
      <h3 className="mb-3 text-[1.28rem] font-bold">{course.name}</h3>
      <p className="mb-5">{course.description}</p>

      <div className="courses-center mb-5 grid grid-cols-[repeat(auto-fill,minmax(5rem,auto))] gap-2">
        {course.tags.map((tag, i) => (
          <span
            className={cn(
              "inline-block bg-gray-100 px-4 py-2 text-center text-xl",
              i % 2 === 0 ? "rounded-[1rem_0]" : "rounded-[0_1rem]",
            )}
            key={i}
          >
            {tag.name}
          </span>
        ))}
      </div>

      <ul className="[&_svg]:text-olive-500 [&>li]:courses-center mb-7 flex flex-col gap-3 [&_svg]:h-auto [&_svg]:w-[1.525rem] [&>li]:flex [&>li]:gap-2">
        <li>
          <CalendarIcon />
          <span>
            يبدأ: {formatDate(parseISO(course.start_date)).replaceAll("-", "/")}
          </span>
        </li>

        {true && (
          <li>
            <BookIcon />
            <span>
              {toHindiDigits(course.num_lectures)}{" "}
              {getArabicPlural(course.num_lectures, {
                singular: "محاضرة",
                twofer: "محاضرتان",
                plural: "محاضرات",
              })}
            </span>
          </li>
        )}

        <li>
          <CalendarIcon />
          <span>
            {course.schedules.map((s) => s.weekday_display).join(" \\ ")}
          </span>
        </li>

        <li>
          <ClockIcon />
          <span>من الساعة 8 مـ حتى 10 مـ</span>
        </li>
      </ul>

      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3">
        <ProgressBar className="h-4" progress={course.course_progress} />
        <span className="font-bold">{course.course_progress}% تقدم</span>
      </div>
    </ItemCard>
  );
}
