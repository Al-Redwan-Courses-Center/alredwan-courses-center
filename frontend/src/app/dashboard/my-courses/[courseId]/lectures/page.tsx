import CourseHeader from "@/components/courses/CourseHeader";
import CourseLecturesView from "@/components/courses/CourseLecturesView";
import { COURSES } from "@/dev-data/db";
import { Course, Lecture } from "@/types/entities";

export default async function page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = COURSES.find((c) => c.id === +courseId);

  return (
    <div className="flex flex-col px-16 pt-4">
      <CourseHeader course={course as Course} />

      <CourseLecturesView
        lectures={course?.lectures as Lecture[]}
        course={course as Course}
      />
    </div>
  );
}
