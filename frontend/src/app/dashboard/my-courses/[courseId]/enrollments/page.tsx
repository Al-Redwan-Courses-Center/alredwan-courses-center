import { getCourseById } from "@/actions/courses";
import { getInstructorEnrollmentsByCourseId } from "@/actions/enrollments";
import CourseHeader from "@/components/courses/CourseHeader";
import CourseEnrollmentsView from "@/components/enrollments/CourseEnrollmentsView";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course, enrollments] = await Promise.all([
    getCourseById(courseId),
    getInstructorEnrollmentsByCourseId(courseId),
  ]);

  return (
    <div className="flex flex-col px-16 pt-4">
      <CourseHeader course={course} />
      <CourseEnrollmentsView enrollments={enrollments} />
    </div>
  );
}
