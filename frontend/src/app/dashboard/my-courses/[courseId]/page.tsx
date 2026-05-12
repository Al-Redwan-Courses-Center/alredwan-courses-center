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
    <div className="flex h-full flex-col px-12 pt-4 pb-10 gap-10 overflow-y-auto overflow-x-hidden">
      <CourseHeader course={course} />

      {isInstructor ? (
        <CourseDetailsForm course={course} />
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {/* Description Section */}
          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-soft p-10 flex flex-col gap-6">
              <h2 className="text-olive-700 text-4xl font-bold flex items-center gap-4">
                  <Pencil size={24} className="text-olive-400" />
                  تفاصيل الدورة
              </h2>
              <p className="text-gray-600 text-2xl leading-relaxed whitespace-pre-wrap">
                  {course?.description || "لا يوجد وصف متاح لهذه الدورة حالياً."}
              </p>
          </div>

          {/* Ratings Section */}
          <div className="bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-soft p-10">
              <h2 className="text-olive-700 text-4xl font-bold mb-10 text-center">تقييماتك وآراء الطلاب</h2>
              <RatingsSection 
                  type="course" 
                  id={courseId} 
                  showForm={true} 
              />
          </div>
        </div>
      )}
    </div>
  );
}