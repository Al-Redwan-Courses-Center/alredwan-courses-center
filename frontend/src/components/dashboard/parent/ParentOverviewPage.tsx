import { getUser } from "@/actions/auth";
import {
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import { getParentChildren } from "@/actions/user";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import ParentOverviewHeader from "@/components/dashboard/parent/ParentOverviewHeader";
import Button from "@/components/ui/Button";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import Link from "next/link";

export default async function ParentOverviewPage() {
  const { first_name } = await getUser();

  const [myChildren, myEnrollmentRequests, myEnrollments] = await Promise.all([
    getParentChildren(),
    getMyEnrollmentRequests(),
    getMyEnrollments(),
  ]);

  const sortedEnrollmentResquests = myEnrollmentRequests.sort(
    (a, b) =>
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ] -
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ],
  );

  const pendingEnrollmentRequestsCount = myEnrollmentRequests.filter(
    (enrollment) => enrollment.status === "pending",
  ).length;

  const totalPaid = myEnrollments.reduce((acc, enrollment) => {
    const paid = Number.parseFloat(enrollment.amount_paid || "0");
    return acc + (Number.isNaN(paid) ? 0 : paid);
  }, 0);

  console.log("Children", myChildren);
  console.log("Enrollment Requests", myEnrollmentRequests);
  console.log("Enrollments", myEnrollments);

  return (
    <div className="ps-16 pt-15 *:pe-16">
      <h3 className="text-olive-700 font-medad mb-8 text-6xl">
        السلام عليكم يا {first_name}
      </h3>

      <ParentOverviewHeader
        myChildrenCount={myChildren.length}
        pendingEnrollmentsCount={pendingEnrollmentRequestsCount}
        totalPaid={totalPaid}
      />

      <div className="[&>div]:separators-[7.25rem] [&>div]:border-olive-200 grid grid-cols-2 pe-0!">
        <div className="flex flex-col gap-6">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-olive-700 text-5xl font-bold">
              أطفالي المسجلين
            </h4>
            {myChildren.length > 2 && (
              <Button
                href="/dashboard/my-children"
                variant="light"
                size="small"
              >
                عرض الكل
              </Button>
            )}
          </div>
 
          <div className="grid grid-cols-2 items-center gap-12">
            {myChildren.length > 0 ? (
              myChildren.slice(0, 2).map((c, i) => {
                const childEnrollments = myEnrollments.filter((e) => e.child_id === c.id);
                const childRequests = myEnrollmentRequests.filter((req) => req.child_id === c.id);

                const activeCoursesCount = childEnrollments.filter((e) => e.status === "active").length;
                const pendingEnrollmentsCount = childRequests.filter(
                  (req) => ["pending", "processing"].includes(req.status)
                ).length;
                const attendanceRate = childEnrollments.length
                  ? Math.round(
                      childEnrollments.reduce(
                        (acc, enrollment) => acc + (enrollment.completion_percentage || 0),
                        0,
                      ) / childEnrollments.length,
                    )
                  : 0;

                return (
                  <ChildCard
                    key={c.id}
                    index={i}
                    child={c}
                    activeCoursesCount={activeCoursesCount}
                    pendingEnrollmentsCount={pendingEnrollmentsCount}
                    attendanceRate={attendanceRate}
                  />
                );
              })
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
        </div>

        <EnrollmentRequestsList
          enrollments={sortedEnrollmentResquests}
          listStyles="max-h-[calc(100dvh-55rem)]"
        />
      </div>
    </div>
  );
}
