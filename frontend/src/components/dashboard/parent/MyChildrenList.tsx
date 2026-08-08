import { ParentChildDetail } from "@/actions/user";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import {
  AddChildCard,
  AddChildButton,
} from "@/components/dashboard/parent/AddChildButtons";
import ChildEnrollmentRequestsFeed from "@/components/dashboard/parent/ChildEnrollmentRequestsFeed";
import {
  EnrollmentListItem,
  EnrollmentRequestListItem,
} from "@/types/entities";

export interface ChildWithData {
  child: ParentChildDetail;
  enrollments: EnrollmentListItem[];
  enrollmentRequests: EnrollmentRequestListItem[];
}

export default function MyChildrenList({
  initialChildren,
  childrenData,
  initialRequests,
}: {
  initialChildren: ParentChildDetail[];
  childrenData: ChildWithData[];
  initialRequests: { [childId: string]: EnrollmentRequestListItem[] };
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Transparent Header matching standard page headers */}
      <div className="mb-8 flex flex-col gap-2 px-6 pt-2 pb-6">
        <h3 className="text-olive-700 font-medad text-6xl">إدارة الأطفال</h3>
        <p className="tablet-sm:text-xl text-2xl text-gray-500">
          أضف وتابع المسيرة الدراسية لأطفالك بكل سهولة.
        </p>
      </div>

      {/* Children List Container */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-20">
        {initialChildren.length > 0 ? (
          <div className="flex flex-col gap-16">
            {/* The First Row: Grid of Cards (Add Child + Child Cards) */}
            <div className="tablet:grid-cols-1 grid grid-cols-3 gap-8">
              <AddChildCard />
              {childrenData.map((data, i) => {
                const activeCoursesCount = data.enrollments.filter(
                  (e) => e.status === "active",
                ).length;
                const pendingEnrollmentsCount = data.enrollmentRequests.filter(
                  (req) => ["pending", "processing"].includes(req.status),
                ).length;
                const attendanceRate = data.enrollments.length
                  ? Math.round(
                      data.enrollments.reduce(
                        (acc, enrollment) =>
                          acc + (enrollment.completion_percentage || 0),
                        0,
                      ) / data.enrollments.length,
                    )
                  : 0;

                return (
                  <div key={data.child.id}>
                    <ChildCard
                      index={i}
                      child={data.child}
                      activeCoursesCount={activeCoursesCount}
                      pendingEnrollmentsCount={pendingEnrollmentsCount}
                      attendanceRate={attendanceRate}
                    />
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div className="bg-olive-100 mx-auto my-2 h-px w-2/3" />

            {/* Tabbed Enrollment Requests Feed */}
            <ChildEnrollmentRequestsFeed
              childrenList={initialChildren}
              initialRequests={initialRequests}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 py-40 text-center">
            <span className="text-4xl font-bold text-red-800">
              لا يوجد أطفال مسجلين حالياً!
            </span>
            <p className="text-2xl text-gray-500">
              ابدأ بإضافة طفلك الأول للبدء في التسجيل في الدورات.
            </p>
            <AddChildButton className="px-12 py-4" />
          </div>
        )}
      </div>
    </div>
  );
}
