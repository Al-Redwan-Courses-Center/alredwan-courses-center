import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import StudentOverviewCoursesAccordion from "@/components/dashboard/student/StudentOverviewCoursesAccordion";
import StudentOverviewEnrollmentRequestsAccordion from "@/components/dashboard/student/StudentOverviewEnrollmentRequestsAccordion";
import StudentCourseCard from "@/components/dashboard/student/StudentCourseCard";
import StudentOverviewHeader from "@/components/dashboard/student/StudentOverviewHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function StudentOverviewPage({
  name,
  activeCourses = [],
  enrollmentRequests = [],
  activeCoursesCount = 0,
  pendingRequestsCount = 0,
  attendanceRate = 0,
}: {
  name: string;
  activeCourses: any[];
  enrollmentRequests: any[];
  activeCoursesCount: number;
  pendingRequestsCount: number;
  attendanceRate: number;
}) {
  const overviewCourses = activeCourses.slice(0, 2);

  return (
    <div className="ps-16 pt-15 *:pe-16 max-[1000px]:px-0 max-[1000px]:*:pe-0">
      <h3 className="text-olive-700 font-medad mb-8 text-6xl max-[1000px]:px-8">
        السلام عليكم يا {name}
      </h3>

      <StudentOverviewHeader
        activeCoursesCount={activeCoursesCount}
        pendingRequestsCount={pendingRequestsCount}
        attendanceRate={attendanceRate}
      />

      <div className="[&>div]:separators-[7.25rem] [&>div]:border-olive-200 grid grid-cols-2 pe-0! max-[1000px]:grid-cols-1 max-[1000px]:gap-8 max-[1000px]:px-8 [&>div]:max-[1000px]:border-0">
        <div className="flex flex-col gap-6">
          <h4 className="text-olive-700 text-5xl font-bold">
            آخر الكورسات المسجلة
          </h4>

          <div className="hidden min-[1000px]:flex min-[1000px]:grow min-[1000px]:items-center min-[1000px]:gap-12">
            {overviewCourses.length > 0 ? (
              overviewCourses.map((c, i) => (
                <StudentCourseCard key={c.id} course={c} index={i} />
              ))
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-4 py-40 text-4xl font-bold">
                <span className="text-red-800">لا توجد دورات مسجلة!</span>
                <span className="mb-10">اشترك في دورة جديدة الآن!</span>
                <Button href="/dashboard/courses" size="small">
                  جميع الدورات
                </Button>
              </div>
            )}
          </div>

          <div className="min-[1000px]:hidden">
            {overviewCourses.length > 0 ? (
              <StudentOverviewCoursesAccordion courses={overviewCourses} />
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-4 py-16 text-3xl font-bold">
                <span className="text-red-800">لا توجد دورات مسجلة!</span>
                <span className="mb-4">اشترك في دورة جديدة الآن!</span>
                <Button href="/dashboard/courses" size="small">
                  جميع الدورات
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="hidden min-[1000px]:block">
            <EnrollmentRequestsList
              enrollments={enrollmentRequests}
              listStyles="max-h-[calc(100dvh-44rem)]"
            />
          </div>

          <div className="min-[1000px]:hidden flex flex-col ps-0! *:ps-29 max-[1000px]:*:ps-0">
            <h4 className="text-olive-700 text-5xl font-bold mb-6">آخر الطلبات</h4>
            {enrollmentRequests.length > 0 ? (
              <StudentOverviewEnrollmentRequestsAccordion
                enrollmentRequests={enrollmentRequests}
              />
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-4 py-16 text-3xl font-bold">
                <span className="text-red-800">لا توجد دورات مسجلة!</span>
                <span className="mb-4">اشترك في دورتك الأولى الآن!</span>
                <Button href="/dashboard/courses" size="small">
                  جميع الدورات
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
