"use client";

import EnrolledCourseCard from "@/components/dashboard/EnrolledCourseCard";
import { Enrollment } from "@/types/dashboard";
import SectionHeader from "./Shared/SectionHeader";

interface CoursesListProps {
  enrollments: Enrollment[];
  onViewCourseDetails: (enrollmentId: number) => void;
  mode: "student" | "child";
}

export default function CoursesList({
  enrollments,
  onViewCourseDetails,
  mode,
}: CoursesListProps) {
  const isEmpty = enrollments.length === 0;

  const emptyMessage =
    mode === "student"
      ? "لا توجد دورات مسجلة حالياً"
      : "لا توجد دورات مسجلة لهذا الطالب";

  return (
    <section className="tablet:mb-12 tablet:px-8 mobile:mb-8 mobile:px-4 mb-17 px-16 py-14">
      <SectionHeader title="دوراتي" />

      {isEmpty ? (
        <div className="border-olive-300 bg-olive-50 tablet:p-8 mobile:p-6 rounded-lg border-2 p-10 text-center">
          <p className="text-olive-800 tablet:text-xl mobile:text-lg text-2xl">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="tablet:mt-6 tablet:grid-cols-2 tablet:gap-17 mobile:mt-4 mobile:grid-cols-1 mobile:gap-6 mt-8 grid grid-cols-3 gap-27">
          {enrollments.map((enrollment, i) => (
            <EnrolledCourseCard
              key={enrollment.id}
              enrollment={enrollment}
              index={i}
              onViewDetails={() => onViewCourseDetails(enrollment.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
