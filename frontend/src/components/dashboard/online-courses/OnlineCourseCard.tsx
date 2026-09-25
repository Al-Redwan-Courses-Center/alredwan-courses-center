import Image from "next/image";
import ClockIcon from "@/components/icons/ClockIcon";
import OpenBookIcon from "@/components/icons/OpenBookIcon";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import { cn, formatDuration, toHindiDigits } from "@/lib/utils";
import { OnlineCourseListItem } from "@/types/entities";

interface OnlineCourseCardProps {
  course: OnlineCourseListItem;
  index?: number;
  /** `studio`: instructor's read-only content viewer, no enroll/price CTA. */
  linkTo?: "dashboard" | "landing" | "studio";
}

function getCourseHref(
  course: OnlineCourseListItem,
  linkTo: NonNullable<OnlineCourseCardProps["linkTo"]>,
) {
  if (linkTo === "studio") return `/dashboard/studio/${course.id}`;
  if (linkTo === "dashboard") {
    return course.is_enrolled
      ? `/dashboard/online-courses/${course.id}/learn`
      : `/dashboard/online-courses/${course.id}`;
  }
  return `/online-courses/${course.id}`;
}

export default function OnlineCourseCard({
  course,
  index = 0,
  linkTo = "landing",
}: OnlineCourseCardProps) {
  const isCourseImageValid =
    course.thumbnail?.startsWith("http") || course.thumbnail?.startsWith("/");
  const isStudio = linkTo === "studio";

  return (
    <ItemCard
      cardHeader={
        !!course.thumbnail && isCourseImageValid ? (
          <Image
            src={course.thumbnail}
            alt={course.name}
            fill
            draggable="false"
            className="object-cover"
          />
        ) : (
          <div className="grid place-items-center bg-gray-200">
            <OpenBookIcon className="text-olive-700 h-auto w-25" />
          </div>
        )
      }
      cardFooter={
        <div
          className={cn(
            "relative mx-auto mt-3 mb-15 grid w-6/10 grid-cols-2 gap-4",
          )}
        >
          <Button
            variant="primary"
            size="small"
            href={getCourseHref(course, linkTo)}
            className="mobile-lg:text-[1.8rem] mobile:text-[2.2rem] px-0 text-[1.125rem]"
          >
            {isStudio
              ? "عرض المحتوى"
              : course.is_enrolled
                ? "مشاهدة الدورة"
                : "عرض الدورة"}
          </Button>
        </div>
      }
      index={index}
    >
      <h3 className="mobile-lg:text-[2.4rem] mobile:text-[3rem] mb-3 line-clamp-2 text-[1.28rem] font-bold break-words">
        {course.name}
      </h3>
      <p className="mb-5 line-clamp-3 break-words">{course.description}</p>

      <ul className="[&_svg]:text-olive-500 mb-7 flex flex-col gap-3 [&_svg]:h-auto [&_svg]:w-[1.525rem] [&_svg]:shrink-0 [&>li]:flex [&>li]:items-center [&>li]:gap-2">
        <li>
          <ClockIcon />
          <span>
            {course.video_count} فيديو •{" "}
            {formatDuration(course.total_duration_seconds)}
          </span>
        </li>
      </ul>

      {!isStudio && (
        <p className="text-olive-500 text-4xl font-bold">
          {toHindiDigits(Number(course.price))} جنيه
        </p>
      )}
    </ItemCard>
  );
}
