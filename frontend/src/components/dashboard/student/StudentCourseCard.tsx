"use client";
import { usePathname } from "next/navigation";
import { parseISO } from "date-fns";
import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import ProgressBar from "@/components/ui/ProgressBar";
import { StudentPhysicalCourse } from "@/types/entities";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import type { UserEntity } from "@/types/auth";

export default function StudentCourseCard({
  course,
  index,
  role,
  childId,
}: {
  course: StudentPhysicalCourse;
  index: number;
  role: UserEntity["role"];
  childId?: string;
}) {
  const pathname = usePathname();
  const activeChildId =
    childId ||
    (role === "parent" && pathname.startsWith("/dashboard/my-children/")
      ? pathname.split("/")[3]
      : undefined);

  let targetHref = `/dashboard/my-courses/${course.id}`;
  if (role === "parent" && activeChildId) {
    if (pathname.startsWith("/dashboard/my-children/")) {
      targetHref = `/dashboard/my-children/${activeChildId}/courses/${course.id}`;
    } else {
      targetHref = `/dashboard/my-courses/${course.id}?child=${activeChildId}`;
    }
  }
  const imageSrc = course.image || CourseImage;
  const tags = course.tags || [];
  const startDate = course.start_date;
  const numLectures = course.num_lectures;
  const schedules = course.schedules;

  return (
    <ItemCard
      index={index}
      cardHeader={
        <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
          <Image
            src={imageSrc}
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
          {course.enrollment_status === "pending" ||
          course.enrollment_status === "processing" ? (
            <span className="rounded-lg bg-orange-50 px-4 py-2 font-bold text-orange-500">
              {course.enrollment_status_display || "قيد المراجعة"}
            </span>
          ) : (
            <Button size="small" href={targetHref}>
              عرض الدورة
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-[1.28rem] font-bold">{course.name}</h3>
      </div>
      <p className="mb-5 line-clamp-2">{course.description}</p>

      {tags && tags.length > 0 && (
        <div className="courses-center mb-5 grid grid-cols-[repeat(auto-fill,minmax(5rem,auto))] gap-2">
          {tags.map((tag: { name: string }, i: number) => (
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
      )}

      <ul className="[&>li]:courses-center mb-7 flex flex-col gap-3 [&_svg]:h-auto [&_svg]:w-[1.525rem] [&_svg]:text-olive-500 [&>li]:flex [&>li]:gap-2">
        {startDate && (
          <li>
            <CalendarIcon />
            <span>
              يبدأ: {formatDate(parseISO(startDate)).replaceAll("-", "/")}
            </span>
          </li>
        )}

        {numLectures !== undefined && (
          <li>
            <BookIcon />
            <span>
              {toHindiDigits(numLectures)}{" "}
              {getArabicPlural(numLectures, {
                singular: "محاضرة",
                twofer: "محاضرتان",
                plural: "محاضرات",
              })}
            </span>
          </li>
        )}

        {schedules && schedules.length > 0 && (
          <li>
            <CalendarIcon />
            <span>
              {schedules
                .map((s: { weekday_display: string }) => s.weekday_display)
                .join(" \\ ")}
            </span>
          </li>
        )}
      </ul>

      <div className="mt-auto grid grid-cols-[1fr_auto] items-center gap-x-3">
        <ProgressBar className="h-4" progress={course.course_progress} />
        <span className="font-bold">{course.course_progress}% تقدم</span>
      </div>
    </ItemCard>
  );
}
