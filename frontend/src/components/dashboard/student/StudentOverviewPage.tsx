import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import StudentCourseCard from "@/components/dashboard/student/StudentCourseCard";
import StudentOverviewCoursesAccordion from "@/components/dashboard/student/StudentOverviewCoursesAccordion";
import StudentOverviewEnrollmentRequestsAccordion from "@/components/dashboard/student/StudentOverviewEnrollmentRequestsAccordion";
import StudentOverviewHeader from "@/components/dashboard/student/StudentOverviewHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type {
  EnrollmentRequestListItem,
  StudentCourseItem,
} from "@/types/entities";
import type { UserEntity } from "@/types/auth";

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
  parentName,
  activeCourses = [],
  enrollmentRequests = [],
  activeCoursesCount = 0,
  pendingRequestsCount = 0,
  attendanceRate = 0,
  role,
}: {
  name: string;
  parentName?: string;
  activeCourses: StudentCourseItem[];
  enrollmentRequests: EnrollmentRequestListItem[];
  activeCoursesCount: number;
  pendingRequestsCount: number;
  attendanceRate: number;
  role: UserEntity["role"];
}) {
  const overviewCourses = activeCourses.slice(0, 2);

  return (
    <div className="w-full overflow-x-auto px-16 pt-15 max-[1000px]:px-4 sm:max-[1000px]:px-8">
      <h1 className="dashboard-greeting mb-8">
        {role === "parent" && parentName
          ? `السلام عليكم يا ${parentName} (لوحة متابعة الطالب: ${name})`
          : `السلام عليكم يا ${name}`}
      </h1>

      <StudentOverviewHeader
        activeCoursesCount={activeCoursesCount}
        pendingRequestsCount={pendingRequestsCount}
        attendanceRate={attendanceRate}
      />

      <div className="grid min-w-0 grid-cols-2 gap-x-12 gap-y-12 xl:gap-x-29 max-[1000px]:grid-cols-1">
        <div className="flex flex-col gap-6">
          <h2 className="dashboard-section-title">آخر الكورسات المسجلة</h2>

          <div className="hidden min-[1000px]:flex min-[1000px]:grow min-[1000px]:items-center min-[1000px]:gap-12">
            {overviewCourses.length > 0 ? (
              overviewCourses.map((c, i) => (
                <StudentCourseCard
                  key={c.id}
                  course={c}
                  index={i}
                  role={role}
                />
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

          <div className="flex flex-col ps-0! *:ps-29 max-[1000px]:*:ps-0 min-[1000px]:hidden">
            <h4 className="mb-6 text-5xl font-bold text-olive-700">
              آخر الطلبات
            </h4>
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
