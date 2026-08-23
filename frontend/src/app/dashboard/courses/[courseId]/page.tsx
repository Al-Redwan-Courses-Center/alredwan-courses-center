import { Pencil } from "lucide-react";
import Image from "next/image";
import { getUser } from "@/actions/auth";
import { getCourseById } from "@/actions/courses";
import {
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import { getParentChildren } from "@/actions/user";
import CourseImage from "@/assets/course-img.jpg";
import CourseHeader from "@/components/courses/CourseHeader";
import CoursePurchaseModal from "@/components/courses/CoursePurchaseModal";
import RatingsSection from "@/components/ratings/RatingsSection";
import Button from "@/components/ui/Button";
import { toHindiDigits } from "@/lib/utils";

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
  const isParent = user.role === "parent";
  const enrollmentRole = isParent ? "parent" : "student";

  const [myEnrollments, myEnrollmentRequests, parentChildren] =
    await Promise.all([
      getMyEnrollments(),
      isParent ? Promise.resolve([]) : getMyEnrollmentRequests(),
      isParent ? getParentChildren() : Promise.resolve([]),
    ]);

  const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

  const enrolledChildNamesInCourse = new Set(
    myEnrollments
      .filter(
        (enrollment) =>
          String(enrollment.course) === String(courseId) &&
          enrollment.participant_type === "child" &&
          !!enrollment.participant_name,
      )
      .map((enrollment) => normalizeName(enrollment.participant_name!)),
  );

  const childrenOptions = parentChildren.filter((child) => {
    const fullName = normalizeName(`${child.first_name} ${child.last_name}`);

    return !enrolledChildNamesInCourse.has(fullName);
  });

  const hasActiveEnrollment = myEnrollments.some(
    (enrollment) => String(enrollment.course) === String(courseId),
  );

  const activeEnrollmentRequest = myEnrollmentRequests.find(
    (request) =>
      String(request.course) === String(courseId) &&
      ["pending", "processing"].includes(request.status),
  );

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center px-16">
        <div className="shadow-soft rounded-[2.5rem_0] bg-gray-50 px-16 py-12 text-center">
          <h2 className="text-olive-500 mb-4 text-5xl font-bold">
            لم نتمكن من تحميل تفاصيل الدورة
          </h2>
          <Button href="/dashboard/courses" size="small">
            العودة إلى الدورات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="h-full overflow-y-auto px-16 py-8 max-[1000px]:px-8">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <Button
            href="/dashboard/courses"
            variant="secondary"
            size="small"
            className="shadow-soft w-fit border-none bg-white/60 px-10 backdrop-blur-sm"
          >
            العودة إلى كل الدورات
          </Button>
        </div>

        <CourseHeader course={course} />

        {/* Content Grid */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-12 max-[1000px]:grid-cols-1">
          {/* Left Column: Image & Details */}
          <div className="flex flex-col gap-10">
            <div className="shadow-soft relative aspect-video overflow-hidden rounded-[3rem] border-4 border-white/40">
              <Image
                src={course.image || CourseImage}
                alt={course.name}
                fill
                className="object-cover"
                draggable="false"
                priority
              />
            </div>

            <div className="shadow-soft flex flex-col gap-6 rounded-[2.5rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md max-[1000px]:p-6">
              <h2 className="text-olive-700 flex items-center gap-4 text-4xl font-bold">
                <Pencil size={24} className="text-olive-400" />
                عن الدورة
              </h2>
              <p className="text-2xl leading-relaxed whitespace-pre-wrap text-gray-600">
                {course.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                {course.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-olive-50 text-olive-600 border-olive-100 rounded-full border px-6 py-2 text-xl font-bold"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Purchase */}
          <div className="flex flex-col gap-10">
            <div className="shadow-soft flex flex-col gap-8 rounded-[2.5rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md max-[1000px]:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-xl text-gray-400">رسوم الدورة</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-olive-700 text-6xl font-bold">
                    {toHindiDigits(course.price)}
                  </span>
                  <span className="text-olive-500 text-2xl font-bold">
                    جنيه مصري
                  </span>
                </div>
              </div>

              <p className="text-xl text-gray-500 italic">
                احجز مكانك الآن واستفد من خصم الفترة المحدودة لطلاب الأكاديمية.
              </p>

              <div className="flex flex-col gap-4">
                {hasActiveEnrollment ? (
                  <Button className="w-full py-6 text-3xl" disabled>
                    أنت مشترك بالفعل
                  </Button>
                ) : activeEnrollmentRequest ? (
                  <Button className="w-full py-6 text-3xl" disabled>
                    طلبك قيد المراجعة
                  </Button>
                ) : (
                  <CoursePurchaseModal
                    role={enrollmentRole}
                    courseId={courseId}
                    coursePrice={course.price}
                    childrenOptions={childrenOptions}
                  />
                )}

                <Button
                  href="/contact-us"
                  variant="secondary"
                  className="w-full bg-white/80 py-6 text-3xl hover:bg-white"
                >
                  تواصل للاستفسار
                </Button>
              </div>
            </div>

            <div className="shadow-soft rounded-[2.5rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md max-[1000px]:p-6">
              <h3 className="text-olive-700 mb-6 text-3xl font-bold">
                لماذا تختار الرضوان؟
              </h3>
              <ul className="space-y-4">
                {[
                  "مناهج معتمدة ومبسطة",
                  "معلمين ذوي خبرة عالية",
                  "متابعة دورية وتقارير أداء",
                  "بيئة تعليمية تفاعلية وآمنة",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-xl text-gray-600"
                  >
                    <div className="bg-olive-400 h-2 w-2 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Ratings Section */}
        <div className="shadow-soft mt-8 rounded-[3rem] border border-white/60 bg-white/40 p-10 backdrop-blur-md max-[1000px]:p-6">
          <h2 className="text-olive-700 mb-10 text-center text-4xl font-bold">
            تقييمات الدورة وآراء الطلاب
          </h2>
          <RatingsSection
            type="course"
            id={courseId}
            showForm={hasActiveEnrollment}
          />
        </div>
      </div>
    </main>
  );
}
