"use client";

import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import Accordion from "@/components/ui/accordion/Accordion";
import AccordionHeader from "@/components/ui/accordion/AccordionHeader";
import AccordionItem from "@/components/ui/accordion/AccordionItem";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import { CourseDetail } from "@/types/entities";
import { parseISO } from "date-fns";

interface StudentOverviewCoursesAccordionProps {
  courses: any[];
}

export default function StudentOverviewCoursesAccordion({
  courses,
}: StudentOverviewCoursesAccordionProps) {
  return (
    <Accordion className="gap-4" allowMultiple>
      {courses.map((course) => (
        <AccordionItem
          key={course.id}
          id={String(course.id)}
          rounded="all"
          header={(isOpen) => (
            <AccordionHeader isOpen={isOpen} className="gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <BookIcon className="text-olive-500 h-7 w-7 shrink-0" />
                <span className="text-olive-700 truncate text-2xl font-bold">
                  {course.name}
                </span>
              </div>
            </AccordionHeader>
          )}
          headerClassName="h-auto min-h-16 py-4"
          contentClassName="space-y-5"
        >
          <p className="text-xl leading-relaxed text-gray-700">
            {course.description}
          </p>

          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag: any, index: number) => (
                <span
                  className={cn(
                    "bg-gray-50 px-3 py-1 text-lg",
                    index % 2 === 0 ? "rounded-[0.8rem_0]" : "rounded-[0_0.8rem]",
                  )}
                  key={tag.id}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <ul className="space-y-2 text-xl text-gray-700 [&_svg]:h-6 [&_svg]:w-6">
            {course.start_date && (
              <li className="flex items-center gap-2">
                <CalendarIcon className="text-olive-500" />
                <span>
                  يبدأ: {formatDate(parseISO(course.start_date)).replaceAll("-", "/")}
                </span>
              </li>
            )}
            
            {course.num_lectures !== undefined && (
              <li className="flex items-center gap-2">
                <BookIcon className="text-olive-500" />
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

            {course.video_count !== undefined && (
              <li className="flex items-center gap-2">
                <BookIcon className="text-olive-500" />
                <span>
                  {toHindiDigits(course.video_count)}{" "}
                  {getArabicPlural(course.video_count, {
                    singular: "فيديو",
                    twofer: "فيديوهان",
                    plural: "فيديوهات",
                  })}
                </span>
              </li>
            )}

            {course.schedules && course.schedules.length > 0 && (
              <li className="flex items-center gap-2">
                <CalendarIcon className="text-olive-500" />
                <span>{course.schedules.map((s: any) => s.weekday_display).join(" \\\\ ")}</span>
              </li>
            )}
          </ul>

          <div className="grid grid-cols-[1fr_auto] items-center gap-x-3">
            <ProgressBar className="h-3" progress={course.course_progress} />
            <span className="text-lg font-bold text-olive-700">
              {course.course_progress}% تقدم
            </span>
          </div>

          <div className="pt-1">
            {course.enrollment_status === "pending" || course.enrollment_status === "processing" ? (
              <span className="text-orange-500 font-bold px-4 py-2 bg-orange-50 rounded-lg">
                {course.enrollment_status_display || "قيد المراجعة"}
              </span>
            ) : (
              <Button 
                size="small" 
                href={
                  course.type === "online" 
                    ? `/dashboard/online-courses/${course.id}/learn`
                    : `/dashboard/my-courses/${course.id}`
                }
              >
                {course.type === "online" ? "مشاهدة الدورة" : "عرض الدورة"}
              </Button>
            )}
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
