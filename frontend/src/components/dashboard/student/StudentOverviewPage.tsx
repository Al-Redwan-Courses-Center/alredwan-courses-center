import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import StudentOverviewCoursesAccordion from "@/components/dashboard/student/StudentOverviewCoursesAccordion";
import StudentOverviewEnrollmentRequestsAccordion from "@/components/dashboard/student/StudentOverviewEnrollmentRequestsAccordion";
import StudentCourseCard from "@/components/dashboard/student/StudentCourseCard";
import StudentOverviewHeader from "@/components/dashboard/student/StudentOverviewHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";

const emptyActionClassName =
  "!shadow-[0_4px_14px_rgba(47,61,56,0.2)] hover:!shadow-[0_6px_18px_rgba(47,61,56,0.24)]";

function BrowseCoursesButton() {
  return (
    <Button
      href="/dashboard/courses"
      size="small"
      className={emptyActionClassName}
    >
      جميع الدورات
    </Button>
  );
}

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
    <div className="px-16 max-[1000px]:px-8 pt-15">
      <h1 className="dashboard-greeting mb-8">
        السلام عليكم يا {name}
      </h1>

      <StudentOverviewHeader
        activeCoursesCount={activeCoursesCount}
        pendingRequestsCount={pendingRequestsCount}
        attendanceRate={attendanceRate}
      />

      <div className="[&>div]:separators-[7.25rem] [&>div]:border-olive-200 grid grid-cols-2 max-[1000px]:grid-cols-1 max-[1000px]:gap-8 [&>div]:max-[1000px]:border-0 [&>div]:max-[1000px]:ps-0">
        <div className="flex flex-col gap-6">
          <h2 className="dashboard-section-title">آخر الكورسات المسجلة</h2>

          <div className="hidden min-[1000px]:flex min-[1000px]:grow min-[1000px]:items-center min-[1000px]:gap-12">
            {overviewCourses.length > 0 ? (
              overviewCourses.map((c, i) => (
                <StudentCourseCard key={c.id} course={c} index={i} />
              ))
            ) : (
              <EmptyState
                title="لا توجد دورات مسجلة!"
                description="اشترك في دورة جديدة الآن!"
                action={<BrowseCoursesButton />}
              />
            )}
          </div>

          <div className="min-[1000px]:hidden">
            {overviewCourses.length > 0 ? (
              <StudentOverviewCoursesAccordion courses={overviewCourses} />
            ) : (
              <EmptyState
                className="py-16"
                title="لا توجد دورات مسجلة!"
                description="اشترك في دورة جديدة الآن!"
                action={<BrowseCoursesButton />}
              />
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
              <EmptyState
                className="py-16"
                title="لا توجد طلبات تسجيل!"
                description="اشترك في دورتك الأولى الآن!"
                action={<BrowseCoursesButton />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
