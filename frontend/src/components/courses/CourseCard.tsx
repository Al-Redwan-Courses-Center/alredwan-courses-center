import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import { PublicCourse } from "@/dev-data/public-courses";
import cn from "@/utils/cn";
import { toHindiDigits } from "@/utils/toHindiDigits";
import CalendarIcon from "@/components/icons/CalendarIcon";
import BookIcon from "@/components/icons/BookIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import Button from "@/components/ui/Button";

export default function CourseCard({
  course,
  index,
}: {
  course: PublicCourse;
  index: number;
}) {
  return (
    <div
      className={cn(
        "shadow-primary relative flex min-h-200 flex-col overflow-clip bg-[#f5f5f5] text-[1.4rem]",
        index % 2 === 0 ? "rounded-[19.45rem_0]" : "rounded-[0_19.45rem]",
      )}
    >
      <Image src={CourseImage} alt="Template Course Image" draggable="false" />

      <div className="px-22 py-10">
        <h3 className="mb-3 text-3xl font-bold">{course.title}</h3>
        <p className="mb-5">
          دورات شامل لتعلم تلاوة القرآن الكريم وأحكام التجويد
        </p>

        <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(5rem,auto))] items-center gap-2">
          {course.tags.map((tag, i) => (
            <span
              className={cn(
                "inline-block bg-gray-100 px-4 py-2 text-center text-xl",
                i % 2 === 0 ? "rounded-[1rem_0]" : "rounded-[0_1rem]",
              )}
              key={i}
            >
              {tag}
            </span>
          ))}
        </div>

        <ul className="[&_svg]:text-olive-500 mb-7 flex flex-col gap-3 [&_svg]:h-auto [&_svg]:w-[1.525rem] [&>li]:flex [&>li]:items-center [&>li]:gap-2">
          <li>
            <CalendarIcon />
            <span>
              يبدأ: {toHindiDigits(course.startDate).replaceAll("-", "/")}
            </span>
          </li>

          <li>
            <BookIcon />
            <span>{toHindiDigits(course.lectureCount)} محاضرة</span>
          </li>

          <li>
            <PeopleIcon />
            <span>
              الأماكن المتاحة:{" "}
              {toHindiDigits(course.capacity - course.enrolledCount)} من{" "}
              {toHindiDigits(course.capacity)}
            </span>
          </li>
        </ul>

        <p className="text-olive-500 mb-8 text-4xl font-bold">
          {toHindiDigits(course.price)} جنيه
        </p>

        <div
          className={cn(
            "relative grid w-7/8 grid-cols-2 gap-4",
            index % 2 === 0 ? "-left-30" : "-right-18",
          )}
        >
          <Button
            variant="primary"
            size="sm"
            href={`/courses/${course.id}`}
            className="px-0 text-[1.125rem]"
          >
            عرض الدورة
          </Button>

          <Button
            variant="secondary"
            size="sm"
            href="#"
            className="px-0 text-[1.125rem]"
          >
            سجل الآن
          </Button>
        </div>
      </div>
    </div>
  );
}
