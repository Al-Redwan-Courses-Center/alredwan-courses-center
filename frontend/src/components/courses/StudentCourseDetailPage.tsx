import { Pencil } from "lucide-react";
import { getUser } from "@/actions/auth";
import { getCourseById } from "@/actions/courses";
import { getLecturesByCourseId } from "@/actions/lectures";
import { getParentChildren } from "@/actions/user";
import CourseDetailsForm from "@/components/courses/CourseDetailsForm";
import CourseHeader from "@/components/courses/CourseHeader";
import CourseLecturesView from "@/components/courses/CourseLecturesView";
import RatingsSection from "@/components/ratings/RatingsSection";
import type { LectureListItem } from "@/types/entities";

export default async function StudentCourseDetailPage({
  courseId,
  childId,
}: {
  courseId: string;
  childId?: string;
}) {
  const [course, user] = await Promise.all([
    getCourseById(courseId),
    getUser(),
  ]);

  if (user?.role === "instructor") {
    return (
      <div className="flex h-full w-full max-w-full flex-col gap-4 overflow-y-auto px-3 pt-4 pb-6 sm:gap-6 sm:px-6 md:gap-10 md:px-12 md:pb-10">
        <CourseHeader course={course} />
        <CourseDetailsForm course={course} />
      </div>
    );
  }

  let lectures: LectureListItem[] = [];
  let activeChildId = childId;

  if (user?.role === "parent") {
    if (!activeChildId) {
      const children = await getParentChildren();
      activeChildId = children[0]?.id;
    }
    if (activeChildId) {
      lectures = await getLecturesByCourseId(courseId, {
        role: "parent",
        childId: activeChildId,
      });
    }
  } else {
    lectures = await getLecturesByCourseId(courseId, {
      role: "student",
    });
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col gap-4 overflow-y-auto px-3 pt-4 pb-6 sm:gap-6 sm:px-6 md:gap-10 md:px-12 md:pb-10">
      <CourseHeader course={course} />

      <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:gap-6 md:gap-10">
        {/* Description Section */}
        <div className="shadow-soft flex w-full max-w-full flex-col gap-4 overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-md sm:gap-6 sm:rounded-[2.5rem] sm:p-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-olive-700 sm:gap-4 sm:text-4xl">
            <Pencil className="h-5 w-5 text-olive-400 sm:h-6 sm:w-6" />
            تفاصيل الدورة
          </h2>
          <p className="break-words text-sm font-normal leading-relaxed whitespace-pre-wrap text-gray-600 sm:text-2xl">
            {course?.description || "لا يوجد وصف متاح لهذه الدورة حالياً."}
          </p>
        </div>

        {/* Course Lectures View Section */}
        <div className="shadow-soft flex w-full max-w-full transform-gpu flex-col gap-4 overflow-hidden rounded-2xl border border-white/60 bg-white/60 p-3 backdrop-blur-md sm:gap-6 sm:rounded-[2.5rem] sm:p-10">
          <h2 className="mb-3 text-center text-xl font-bold text-olive-700 sm:mb-10 sm:text-4xl">
            محاضرات الدورة
          </h2>
          <CourseLecturesView
            lectures={lectures}
            course={course}
            childId={activeChildId}
          />
        </div>

        {/* Ratings Section */}
        <div className="shadow-soft w-full max-w-full overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-md sm:rounded-[3rem] sm:p-10">
          <h2 className="mb-4 text-center text-xl font-bold text-olive-700 sm:mb-10 sm:text-4xl">
            تقييماتك وآراء الطلاب
          </h2>
          <RatingsSection type="course" id={courseId} showForm={true} />
        </div>
      </div>
    </div>
  );
}
