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
import EmptyState from "@/components/ui/EmptyState";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";

const emptyActionClassName =
  "!shadow-[0_4px_14px_rgba(47,61,56,0.2)] hover:!shadow-[0_6px_18px_rgba(47,61,56,0.24)]";

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

  return (
    <div className="ps-16 pt-15 *:pe-16">
      <h1 className="dashboard-greeting mb-8">السلام عليكم يا {first_name}</h1>

      <ParentOverviewHeader
        myChildrenCount={myChildren.length}
        pendingEnrollmentsCount={pendingEnrollmentRequestsCount}
        totalPaid={totalPaid}
      />

      <div className="[&>div]:separators-[7.25rem] [&>div]:border-olive-200 grid grid-cols-2 pe-0!">
        <div className="flex flex-col gap-6">
          <h2 className="dashboard-section-title mb-6">أبنائي</h2>

          <div
            className={
              myChildren.length === 0
                ? "grid min-h-80 grid-cols-2 items-center gap-12"
                : "grid grid-cols-2 items-center gap-12"
            }
          >
            {myChildren.length > 0 ? (
              myChildren.map((c, i) => (
                <ChildCard key={c.id} index={i} child={c} />
              ))
            ) : (
              <EmptyState
                className="col-span-2"
                title="لا يوجد أبناء مسجلون!"
                description="أضف ابنك للبدء في التسجيل بالدورات"
                action={
                  <Button
                    href="/dashboard/courses"
                    size="small"
                    className={emptyActionClassName}
                  >
                    جميع الدورات
                  </Button>
                }
              />
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
