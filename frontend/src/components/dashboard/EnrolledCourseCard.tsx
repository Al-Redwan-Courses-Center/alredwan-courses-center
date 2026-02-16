"use client";

import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import { Enrollment } from "@/types/dashboard";
import CalendarIcon from "@/components/icons/CalendarIcon";
import BookIcon from "@/components/icons/BookIcon";
import Button from "@/components/ui/Button";
import { cn, toHindiDigits } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface EnrolledCourseCardProps {
  enrollment: Enrollment;
  index: number;
  onViewDetails: () => void;
  className?: string;
}

export default function EnrolledCourseCard({
  enrollment,
  index,
  onViewDetails,
  className = "",
}: EnrolledCourseCardProps) {
  const { course } = enrollment;

  // Format the enrollment date
  const enrollmentDate = new Date(enrollment.enrollment_date)
    .toLocaleDateString("ar-EG")
    .replaceAll("/", "-");

  return (
    <div
      className={cn(
        "shadow-primary relative flex h-full min-h-200 flex-col justify-stretch overflow-clip bg-[#f5f5f5] text-[1.4rem]",
        index % 2 === 0 ? "rounded-[19.45rem_0]" : "rounded-[0_19.45rem]",
        className,
      )}
    >
      <Image src={CourseImage} alt={course.name} draggable="false" />

      <div className="px-22 py-10">
        <h3 className="mb-3 text-3xl font-bold">{course.name}</h3>
        <p className="mb-5 line-clamp-2">{course.description}</p>

        <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(5rem,auto))] items-center gap-2">
          {course.tags?.map((tag, i) => (
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
            <span>تاريخ التسجيل: {toHindiDigits(enrollmentDate)}</span>
          </li>

          <li>
            <BookIcon />
            <span>المحاضرات: {toHindiDigits(course.num_lectures || 0)}</span>
          </li>
        </ul>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">التقدم</span>
            <span className="text-sm font-medium">
              {toHindiDigits(enrollment.progress_percentage)}%
            </span>
          </div>
          <Progress value={enrollment.progress_percentage} className="h-2" />
        </div>

        {/* Attendance Rate */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">نسبة الحضور</span>
            <span className="text-sm font-medium">
              {toHindiDigits(enrollment.attendance_rate)}%
            </span>
          </div>
          <Progress value={enrollment.attendance_rate} className="h-2" />
        </div>

        {/* Status Badge */}
        <div className="mb-5">
          <span
            className={cn(
              "inline-block rounded-full px-5 py-2 text-sm font-medium",
              enrollment.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800",
            )}
          >
            {enrollment.status === "active" ? "نشط" : "مكتمل"}
          </span>
          <span
            className={cn(
              "mr-2 inline-block rounded-full px-5 py-2 text-sm font-medium",
              enrollment.payment_status === "paid"
                ? "bg-green-100 text-green-800"
                : enrollment.payment_status === "partial"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800",
            )}
          >
            {enrollment.payment_status === "paid"
              ? "مدفوع"
              : enrollment.payment_status === "partial"
                ? "دفع جزئي"
                : "غير مدفوع"}
          </span>
        </div>

        <div
          className={cn(
            "relative w-7/8",
            index % 2 === 0 ? "tablet:-left-28 -left-30" : "-right-18",
          )}
        >
          <Button
            variant="primary"
            size="small"
            onClick={onViewDetails}
            className="w-full px-0 text-[1.125rem]"
          >
            عرض التفاصيل
          </Button>
        </div>
      </div>
    </div>
  );
}
