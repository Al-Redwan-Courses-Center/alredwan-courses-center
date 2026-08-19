"use client";

import { parseISO } from "date-fns";
import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import Accordion from "@/components/ui/accordion/Accordion";
import AccordionHeader from "@/components/ui/accordion/AccordionHeader";
import AccordionItem from "@/components/ui/accordion/AccordionItem";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import type { CourseDetail } from "@/types/entities";

interface StudentOverviewCoursesAccordionProps {
  courses: Array<CourseDetail & { course_progress: number }>;
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

          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag, index) => (
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

          <ul className="space-y-2 text-xl text-gray-700 [&_svg]:h-6 [&_svg]:w-6">
            <li className="flex items-center gap-2">
              <CalendarIcon className="text-olive-500" />
              <span>
                يبدأ:{" "}
                {formatDate(parseISO(course.start_date)).replaceAll("-", "/")}
              </span>
            </li>
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
            <li className="flex items-center gap-2">
              <CalendarIcon className="text-olive-500" />
              <span>
                {course.schedules.map((s) => s.weekday_display).join(" \\\\ ")}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="text-olive-500" />
              <span>من الساعة 8 مـ حتى 10 مـ</span>
            </li>
          </ul>

          <div className="grid grid-cols-[1fr_auto] items-center gap-x-3">
            <ProgressBar className="h-3" progress={course.course_progress} />
            <span className="text-lg font-bold text-olive-700">
              {course.course_progress}% تقدم
            </span>
          </div>

          <div className="pt-1">
            <Button size="small" href={`/dashboard/my-courses/${course.id}/`}>
              عرض الدورة
            </Button>
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
