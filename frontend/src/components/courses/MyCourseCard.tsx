import CourseImage from "@/assets/course-img.jpg";
import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import { CourseListItem } from "@/types/entities";
import { parseISO } from "date-fns";
import Image from "next/image";

export default function MyCourseCard({
  course,
  index,
}: {
  course: CourseListItem;
  index: number;
}) {
  const lectureCount = course.num_lectures;
  const isEven = index % 2 === 0;

  return (
    <ItemCard
      cardHeader={
        <Image
          src={course.image || CourseImage}
          alt="Course Image"
          draggable="false"
          fill
          className="object-cover"
        />
      }
      cardFooter={
        <Button
          variant="primary"
          size="small"
          href={`/dashboard/my-courses/${course.id}/lectures`}
          className={cn(
            "px-6 text-[1.125rem]",
            isEven ? "ms-auto block w-fit" : "",
          )}
        >
          عرض الدورة
        </Button>
      }
      index={index}
      key={index}
    >
      <h3 className="mb-3 text-[1.28rem] font-bold">{course.name}</h3>
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
            {formatDate(parseISO(course.start_date)).replaceAll("-", "/")}
          </span>
        </li>

        {!!lectureCount && (
          <li>
            <BookIcon />
            <span>
              {toHindiDigits(lectureCount)}{" "}
              {getArabicPlural(lectureCount, {
                singular: "محاضرة",
                twofer: "محاضرتان",
                plural: "محاضرات",
              })}
            </span>
          </li>
        )}

        <li>
          <PeopleIcon />
          <span>
            الأماكن المتاحة: {toHindiDigits(course.available_spots)} من{" "}
            {toHindiDigits(course.capacity)}
          </span>
        </li>
      </ul>

      <p className="text-olive-500 text-4xl font-bold">
        {toHindiDigits(course.price)} جنيه
      </p>
    </ItemCard>
  );
}
