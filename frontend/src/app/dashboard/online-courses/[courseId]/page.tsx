import { getUser } from "@/actions/auth";
import { getOnlineCourseById } from "@/actions/online-courses";
import {
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import { getParentChildren } from "@/actions/user";
import CourseImage from "@/assets/course-img.jpg";
import CoursePurchaseModal from "@/components/courses/CoursePurchaseModal";
import Button from "@/components/ui/Button";
import {
  toHindiDigits,
} from "@/lib/utils";
import Image from "next/image";
import RatingsSection from "@/components/ratings/RatingsSection";
import { Pencil } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [course, user] = await Promise.all([
    getOnlineCourseById(courseId),
    getUser(),
  ]);
  const isParent = user.role === "parent";

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
          String(enrollment.online_course) === String(courseId) &&
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
    (enrollment) => String(enrollment.online_course) === String(courseId),
  );

  const activeEnrollmentRequest = myEnrollmentRequests.find(
    (request) =>
      String(request.online_course) === String(courseId) &&
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
    <main className="h-full overflow-y-auto px-16 max-[1000px]:px-8 py-8">
      <div className="flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <Button
            href="/dashboard/courses"
            variant="secondary"
            size="small"
            className="w-fit px-10 bg-white/60 backdrop-blur-sm border-none shadow-soft"
          >
            العودة إلى كل الدورات
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-black text-gray-900">{course.name}</h1>
          <p className="text-xl text-gray-500">المدرب: {course.instructor?.name}</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-[1.5fr_1fr] max-[1000px]:grid-cols-1 gap-12">
            
            {/* Left Column: Image & Details */}
            <div className="flex flex-col gap-10">
                <div className="relative aspect-video overflow-hidden rounded-[3rem] shadow-soft border-4 border-white/40 bg-gray-200">
                    <Image
                        src={course.thumbnail || CourseImage}
                        alt={course.name}
                        fill
                        className="object-cover"
                        draggable="false"
                        priority
                    />
                </div>

                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-soft p-10 max-[1000px]:p-6 flex flex-col gap-6">
                    <h2 className="text-olive-700 text-4xl font-bold flex items-center gap-4">
                        <Pencil size={24} className="text-olive-400" />
                        عن الدورة
                    </h2>
                    <p className="text-gray-600 text-2xl leading-relaxed whitespace-pre-wrap">
                        {course.description}
                    </p>
                    

                </div>
            </div>

            {/* Right Column: Pricing & Purchase */}
            <div className="flex flex-col gap-10">
                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-soft p-10 max-[1000px]:p-6 flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-xl">رسوم الدورة</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-olive-700 text-6xl font-bold">
                                {toHindiDigits(course.price)}
                            </span>
                            <span className="text-olive-500 text-2xl font-bold">جنيه مصري</span>
                        </div>
                    </div>

                    <p className="text-gray-500 text-xl italic">
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
                              role={user.role as "parent" | "student"}
                              courseId={course.id}
                              coursePrice={course.price}
                              courseType="online"
                              childrenOptions={childrenOptions}
                            />
                        )}

                        <Button
                            href="/contact-us"
                            variant="secondary"
                            className="w-full py-6 text-3xl bg-white/80 hover:bg-white"
                        >
                            تواصل للاستفسار
                        </Button>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-soft p-10 max-[1000px]:p-6">
                    <h3 className="text-olive-700 text-3xl font-bold mb-6">لماذا تختار الرضوان؟</h3>
                    <ul className="space-y-4">
                        {[
                            "مناهج معتمدة ومبسطة",
                            "معلمين ذوي خبرة عالية",
                            "متابعة دورية وتقارير أداء",
                            "بيئة تعليمية تفاعلية وآمنة"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-xl text-gray-600">
                                <div className="w-2 h-2 rounded-full bg-olive-400" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

        </div>

        {/* Ratings Section */}
        <div className="mt-8 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-soft p-10 max-[1000px]:p-6">
            <h2 className="text-olive-700 text-4xl font-bold mb-10 text-center">تقييمات الدورة وآراء الطلاب</h2>
            <RatingsSection 
                type="online_course" 
                id={courseId} 
                showForm={hasActiveEnrollment} 
            />
        </div>

      </div>
    </main>
  );
}
