import { getUser } from "@/actions/auth";
import { getStudentCourses } from "@/actions/courses";
import { getMyEnrollmentRequests } from "@/actions/enrollments";
import EnrollmentRequestCard from "@/components/dashboard/enrollments/EnrollmentRequestCard";
import StudentOverviewCoursesAccordion from "@/components/dashboard/student/StudentOverviewCoursesAccordion";
import StudentOverviewEnrollmentRequestsAccordion from "@/components/dashboard/student/StudentOverviewEnrollmentRequestsAccordion";
import StudentCourseCard from "@/components/dashboard/student/StudentCourseCard";
import StudentOverviewHeader from "@/components/dashboard/student/StudentOverviewHeader";
import Button from "@/components/ui/Button";
import {
  getChildEnrollmentRequests,
  getChildOngoingEnrollments,
  getMyChildById,
} from "@/dev-data/db";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import Link from "next/link";

export default async function StudentOverviewPage({
  childId = "",
}: {
  childId?: string;
}) {
  const { first_name, role } = await getUser();
  let myActiveCourses: any[], myEnrollmentRequests: any[], name: string;

  if (role === "parent") {
    // TODO(api): Child-specific enrollments are not available yet.
    myActiveCourses = getChildOngoingEnrollments(childId).map((e) => e.course);

    myEnrollmentRequests = getChildEnrollmentRequests(childId).sort(
      (a, b) =>
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ] -
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ],
    );

    // TODO(api): Replace mock child details when the API provides child info.
    const child = getMyChildById(childId);
    name = child ? child.name : "طفل جديد";
  } else {
    // TODO(api): Replace mock active courses once course detail endpoints are wired.
    myActiveCourses = await getStudentCourses();

    const requests = await getMyEnrollmentRequests();

    myEnrollmentRequests = requests.sort(
      (a, b) =>
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ] -
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ],
    );

    name = first_name;
  }
  const overviewCourses = myActiveCourses.slice(0, 2);

  return (
    <div className="ps-16 pt-15 *:pe-16 max-[1000px]:px-0 max-[1000px]:*:pe-0">
      <h3 className="text-olive-700 font-medad mb-8 text-6xl max-[1000px]:px-8">
        السلام عليكم يا {name}
      </h3>

      <StudentOverviewHeader childId={childId} />

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
                <Link href="/dashboard/courses">
                  <Button size="small">جميع الدورات</Button>
                </Link>
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
                <Link href="/dashboard/courses">
                  <Button size="small">جميع الدورات</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col ps-0! *:ps-29 max-[1000px]:*:ps-0">
          <h4 className="text-olive-700 text-5xl font-bold">آخر الطلبات</h4>

          <div className="hidden min-[1000px]:flex min-[1000px]:max-h-[calc(100dvh-44rem)] min-[1000px]:flex-col min-[1000px]:gap-10 min-[1000px]:overflow-y-auto min-[1000px]:pe-16 min-[1000px]:pt-6 min-[1000px]:pb-10">
            {myEnrollmentRequests.length > 0 ? (
              myEnrollmentRequests.map((e) => (
                <EnrollmentRequestCard key={e.id} enrollmentRequest={e} />
              ))
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-4 py-40 text-4xl font-bold">
                <span className="text-red-800">لا توجد دورات مسجلة!</span>
                <span className="mb-10">اشترك في دورتك الأولى الآن!</span>
                <Link href="/dashboard/courses">
                  <Button size="small">جميع الدورات</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="min-[1000px]:hidden">
            {myEnrollmentRequests.length > 0 ? (
              <StudentOverviewEnrollmentRequestsAccordion
                enrollmentRequests={myEnrollmentRequests}
              />
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-4 py-16 text-3xl font-bold">
                <span className="text-red-800">لا توجد دورات مسجلة!</span>
                <span className="mb-4">اشترك في دورتك الأولى الآن!</span>
                <Link href="/dashboard/courses">
                  <Button size="small">جميع الدورات</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
