import { getCourseById } from "@/actions/courses";
import CourseDetailsForm from "@/components/courses/CourseDetailsForm";
import CourseHeader from "@/components/courses/CourseHeader";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await getCourseById(courseId);

  return (
    <div className="flex h-full flex-col px-16 pt-4 pb-10">
      <CourseHeader course={course} />

      <CourseDetailsForm course={course} />
    </div>
  );
}
