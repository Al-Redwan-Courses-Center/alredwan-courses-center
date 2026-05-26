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
    <div className="px-16 pt-12 pb-20 flex flex-col gap-12 w-full">
      <div className="flex flex-col gap-2">
        <h3 className="text-olive-700 font-medad text-6xl font-black">
          السلام عليكم يا {first_name}
        </h3>
        <p className="text-2xl text-gray-500">مرحباً بك في لوحة تحكم ولي الأمر. يمكنك متابعة أطفالك وإدارة طلبات اشتراكهم.</p>
      </div>

      <ParentOverviewHeader
        myChildrenCount={myChildren.length}
        pendingEnrollmentsCount={pendingEnrollmentRequestsCount}
        totalPaid={totalPaid}
      />

      <div className="grid grid-cols-12 gap-16 items-start w-full tablet:grid-cols-1">
        {/* Left Column: Children (7 cols) */}
        <div className="col-span-7 flex flex-col gap-8 w-full tablet:col-span-12">
          <div className="flex items-center justify-between">
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
 
          <div className="grid grid-cols-2 gap-8 items-stretch w-full tablet-sm:grid-cols-1">
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
              <div className="col-span-2 flex w-full flex-col items-center justify-center gap-6 py-36 border-2 border-dashed border-olive-200 rounded-[2rem_0] bg-gray-50/50 text-center px-8 tablet-sm:col-span-1">
                <span className="text-red-800 text-3xl font-bold">لا يوجد أطفال مسجلين حالياً!</span>
                <p className="text-2xl text-gray-500 max-w-[32rem]">ابدأ بإضافة أطفالك للتسجيل في الدورات والورش المتاحة بسهولة.</p>
                <Button href="/dashboard/my-children" size="small">
                  إدارة الأطفال وإضافتهم
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Enrollment Requests (5 cols) */}
        <div className="col-span-5 flex flex-col gap-8 border-s border-olive-150 ps-12 w-full tablet:col-span-12 tablet:border-s-0 tablet:ps-0">
          <EnrollmentRequestsList
            enrollments={sortedEnrollmentResquests}
            listStyles="max-h-[calc(100dvh-52rem)]"
            wrapperStyles="p-0! *:ps-0!"
          />
        </div>
      </div>
    </div>
  );
}
