import CourseDetailsForm from "@/components/courses/CourseDetailsForm";
import CourseHeader from "@/components/courses/CourseHeader";

import { COURSES } from "@/dev-data/db";

import { Course } from "@/types/entities";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = COURSES.find((c) => c.id === +courseId);

  return (
    <div className="flex h-full flex-col px-16 pt-4 pb-10">
      <CourseHeader course={course as Course} />

      <CourseDetailsForm course={course as Course} />
    </div>
  );
}
