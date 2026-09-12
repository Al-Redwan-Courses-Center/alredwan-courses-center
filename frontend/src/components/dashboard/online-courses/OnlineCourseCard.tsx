import { OnlineCourseListItem } from "@/types/entities";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import { cn, toHindiDigits } from "@/lib/utils";
import OpenBookIcon from "@/components/icons/OpenBookIcon";
import ClockIcon from "@/components/icons/ClockIcon";

interface OnlineCourseCardProps {
  course: OnlineCourseListItem;
  index?: number;
  linkTo?: "dashboard" | "landing";
}

function formatDuration(seconds: number) {
  if (!seconds || seconds < 60) return "أقل من دقيقة";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${toHindiDigits(h)} ساعة ${toHindiDigits(m)} دقيقة`;
  if (h > 0) return `${toHindiDigits(h)} ساعة`;
  return `${toHindiDigits(m)} دقيقة`;
}

export default function OnlineCourseCard({ course, index = 0, linkTo = "landing" }: OnlineCourseCardProps) {
  const isEven = index % 2 === 0;
  const isCourseImageValid = course.thumbnail?.startsWith("http") || course.thumbnail?.startsWith("/");

  return (
    <ItemCard
      cardHeader={
        !!course.thumbnail && isCourseImageValid ? (
          <img
            src={course.thumbnail}
            alt={course.name}
            draggable="false"
            className="object-cover w-full h-full"
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
            "relative grid w-6/10 grid-cols-1 gap-4",
            isEven && "justify-self-end",
          )}
        >
          <Button
            variant="primary"
            size="small"
            href={
              course.is_enrolled && linkTo === "dashboard"
                ? `/dashboard/online-courses/${course.id}/learn`
                : linkTo === "dashboard"
                ? `/dashboard/online-courses/${course.id}`
                : `/online-courses/${course.id}`
            }
            className="px-0 text-[1.125rem] mobile-lg:text-[1.8rem] mobile:text-[2.2rem]"
          >
            {course.is_enrolled ? "مشاهدة الدورة" : "عرض الدورة"}
          </Button>
        </div>
      }
      index={index}
    >
      <h3 className="mb-3 text-[1.28rem] mobile-lg:text-[2.4rem] mobile:text-[3rem] font-bold">{course.name}</h3>
      <p className="mb-5 line-clamp-3">{course.description}</p>

      <ul className="[&_svg]:text-olive-500 mb-7 flex flex-col gap-3 [&_svg]:h-auto [&_svg]:w-[1.525rem] [&>li]:flex [&>li]:items-center [&>li]:gap-2">
        <li>
          <ClockIcon />
          <span>{course.video_count} فيديو • {formatDuration(course.total_duration_seconds)}</span>
        </li>
      </ul>

      <p className="text-olive-500 text-4xl font-bold">
        {toHindiDigits(Number(course.price))} جنيه
      </p>
    </ItemCard>
  );
}
