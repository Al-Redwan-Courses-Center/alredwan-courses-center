import { getCourseById } from "@/actions/courses";
import { getUser } from "@/actions/auth";
import CourseDetailsForm from "@/components/courses/CourseDetailsForm";
import CourseHeader from "@/components/courses/CourseHeader";
import RatingsSection from "@/components/ratings/RatingsSection";
import { Pencil } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course, user] = await Promise.all([
    getCourseById(courseId),
    getUser(),
  ]);

  const isInstructor = user?.role === "instructor";

  return (
    <div className="flex h-full flex-col gap-10 overflow-x-hidden overflow-y-auto px-12 pt-4 pb-10">
      <CourseHeader course={course} />

      {isInstructor ? (
        <CourseDetailsForm course={course} />
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {/* Description Section */}
          <div className="shadow-soft flex flex-col gap-6 rounded-[2.5rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md">
            <h2 className="text-olive-700 flex items-center gap-4 text-4xl font-bold">
              <Pencil size={24} className="text-olive-400" />
              تفاصيل الدورة
            </h2>
            <p className="text-2xl leading-relaxed whitespace-pre-wrap text-gray-600">
              {course?.description || "لا يوجد وصف متاح لهذه الدورة حالياً."}
            </p>
          </div>

          {/* Ratings Section */}
          <div className="shadow-soft rounded-[3rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md">
            <h2 className="text-olive-700 mb-10 text-center text-4xl font-bold">
              تقييماتك وآراء الطلاب
            </h2>
            <RatingsSection type="course" id={courseId} showForm={true} />
          </div>
        </div>
      )}
    </div>
  );
}
