import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import OpenBookIcon from "@/components/icons/OpenBookIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import { CourseListItem } from "@/types/entities";
import { parseISO } from "date-fns";
import Image from "next/image";

export default function PublicCourseCard({
  course: course,
  index,
  linkTo = "landing",
}: {
  course: CourseListItem;
  index: number;
  linkTo?: "dashboard" | "landing";
}) {
  const startDate = parseISO(course.start_date);
  // const endDate = parseISO(course.start_date);
  const lectureCount = course.num_lectures;
  const isEven = index % 2 === 0;
  const isCourseImageValid = course.image?.startsWith("https");

  return (
    <ItemCard
      cardHeader={
        !!course.image && isCourseImageValid ? (
          <Image
            src={course.image}
            fill
            alt="Template Course Image"
            draggable="false"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gray-200">
            <OpenBookIcon className="text-olive-700 h-auto w-25" />
          </div>
        )
      }
      cardFooter={
        <div
          className={cn(
            "relative grid w-6/10 grid-cols-2 gap-4",
            isEven && "justify-self-end",
          )}
        >
          <Button
            variant="primary"
            size="small"
            href={
              linkTo === "dashboard"
                ? `/dashboard/courses/${course.id}`
                : `/courses/${course.id}`
            }
            className="px-0 text-[1.125rem]"
          >
            عرض الدورة
          </Button>

          <Button
            variant="secondary"
            size="small"
            revert
            href="#"
            className="px-0 text-[1.125rem]"
          >
            سجل الآن
          </Button>
        </div>
      }
      index={index}
    >
      <h3 className="mb-3 text-[1.28rem] font-bold">{course.name}</h3>
      <p className="mb-5">{course.description}</p>

      <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(5rem,auto))] items-center gap-2">
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

      <ul className="[&_svg]:text-olive-500 mb-7 flex flex-col gap-3 [&_svg]:h-auto [&_svg]:w-[1.525rem] [&>li]:flex [&>li]:items-center [&>li]:gap-2">
        <li>
          <CalendarIcon />
          <span>يبدأ: {formatDate(startDate)}</span>
        </li>

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

        <li>
          <PeopleIcon />
          <span>
            الأماكن المتاحة:{" "}
            <span className="font-bold">
              {toHindiDigits(course.available_spots)}
            </span>{" "}
            من {toHindiDigits(course.capacity)}
          </span>
        </li>
      </ul>

      <p className="text-olive-500 text-4xl font-bold">
        {toHindiDigits(course.price)} جنيه
      </p>
    </ItemCard>
  );
}
