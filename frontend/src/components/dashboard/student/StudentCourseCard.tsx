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
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import type { StudentCourseItem } from "@/types/entities/courses";
import type { UserEntity } from "@/types/auth";

export default function StudentCourseCard({
  course,
  index,
  role,
  childId,
}: {
  course: StudentCourseItem;
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

  const isOnline = course.type === "online";
  let targetHref = isOnline
    ? `/dashboard/online-courses/${course.id}/learn`
    : `/dashboard/my-courses/${course.id}`;

  if (role === "parent" && activeChildId) {
    if (pathname.startsWith("/dashboard/my-children/")) {
      targetHref = isOnline
        ? `/dashboard/my-children/${activeChildId}/online-courses/${course.id}/learn`
        : `/dashboard/my-children/${activeChildId}/courses/${course.id}`;
    } else {
      targetHref = isOnline
        ? `/dashboard/online-courses/${course.id}/learn?child=${activeChildId}`
        : `/dashboard/my-courses/${course.id}?child=${activeChildId}`;
    }
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const courseImage = isOnline ? ("thumbnail" in course ? course.thumbnail : null) : ("image" in course ? course.image : null);
  const imageSrc = courseImage?.startsWith("/")
    ? backendUrl + courseImage
    : courseImage || "/images/placeholder.png";

  const tags = "tags" in course ? course.tags : [];
  const startDate = "start_date" in course ? course.start_date : null;
  const numLectures = "num_lectures" in course ? course.num_lectures : undefined;
  const videoCount = "video_count" in course ? course.video_count : undefined;
  const schedules = "schedules" in course ? course.schedules : undefined;

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
              {isOnline ? "مشاهدة الدورة" : "عرض الدورة"}
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-[1.28rem] font-bold">{course.name}</h3>
        {isOnline && (
          <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
            أونلاين
          </span>
        )}
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

        {isOnline && videoCount !== undefined && (
          <li>
            <BookIcon />
            <span>
              {toHindiDigits(videoCount)}{" "}
              {getArabicPlural(videoCount, {
                singular: "فيديو",
                twofer: "فيديوهان",
                plural: "فيديوهات",
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
