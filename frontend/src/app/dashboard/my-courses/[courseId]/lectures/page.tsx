import { getCourseById } from "@/actions/courses";
import { getLecturesByCourseId } from "@/actions/lectures";
import CourseHeader from "@/components/courses/CourseHeader";
import CourseLecturesView from "@/components/courses/CourseLecturesView";
import RatingsSection from "@/components/ratings/RatingsSection";

export default async function page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await getCourseById(courseId);
  const lectures = await getLecturesByCourseId(courseId);

  return (
    <div className="flex flex-col px-16 pt-4">
      <CourseHeader course={course} />

      <CourseLecturesView lectures={lectures} course={course} />

      <div className="mt-12 pb-20">
        <RatingsSection type="course" id={courseId} showForm={true} />
      </div>
    </div>
  );
}
