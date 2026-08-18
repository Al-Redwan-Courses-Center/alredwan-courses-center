import Button from "@/components/ui/Button";
import Image from "next/image";
import CalendarIcon from "@/components/icons/CalendarIcon";
import BookIcon from "@/components/icons/BookIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { cn, toHindiDigits } from "@/lib/utils";
import { Course } from "@/dev-data/courses";

export default function CourseCard({
  course,
  index,
}: {
  course: Course;
  index: number;
}) {
  return (
    <div
      key={index}
      className={cn(
        "shadow-primary relative grid h-220 grid-rows-[auto_1fr_auto] overflow-clip bg-[#f5f5f5] text-[1.4rem]",
        index % 2 === 0 ? "rounded-[19.45rem_0]" : "rounded-[0_19.45rem]",
      )}
    >
      <div className="relative h-70 w-full">
        <Image
          src={course.image}
          alt="Course Image"
          draggable="false"
          fill
          className="object-cover"
        />
      </div>

      <div className="px-22 pt-10">
        <h3 className="mb-3 text-3xl font-bold">{course.name}</h3>
        <p className="mb-5">
          دورات شامل لتعلم تلاوة القرآن الكريم وأحكام التجويد
        </p>

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
              يبدأ: 
              {toHindiDigits(course.start_date).replaceAll("-", "/")}
            </span>
          </li>

          {!!course.num_lectures && (
            <li>
              <BookIcon />
              <span>{toHindiDigits(course.num_lectures)} محاضرة</span>
            </li>
          )}

          <li>
            <PeopleIcon />
            <span>
              الأماكن المتاحة:{" "}
              {toHindiDigits(course.capacity - course.num_enrolled)} من{" "}
              {toHindiDigits(course.capacity)}
            </span>
          </li>
        </ul>

        <p className="text-olive-500 text-4xl font-bold">
          {toHindiDigits(course.price)} جنيه
        </p>
      </div>

      <Button
        variant="primary"
        size="small"
        href={`/dashboard/my-courses/${course.id}`}
        className={cn(
          "relative mx-10 mb-10 max-w-35 px-6 text-[1.125rem]",
          index % 2 === 0 ? "justify-self-end" : "justify-self-start",
        )}
      >
        عرض الدورة
      </Button>
    </div>
  );
}
