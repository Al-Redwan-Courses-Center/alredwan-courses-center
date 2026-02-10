import { getUser } from "@/actions/auth";
import EnrollmentsList from "@/components/dashboard/enrollments/EnrollmentsList";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import ParentOverviewHeader from "@/components/dashboard/parent/ParentOverviewHeader";
import Button from "@/components/ui/Button";
import {
  getAllMyChildrenEnrollmentRequests,
  getMyChildren,
} from "@/dev-data/db";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import Link from "next/link";

export default async function ParentOverviewPage() {
  const { first_name } = await getUser();
  const myChildren = getMyChildren();
  const allEnrollments = getAllMyChildrenEnrollmentRequests().sort(
    (a, b) =>
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ] -
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ],
  );

  return (
    <div className="ps-16 pt-15 *:pe-16">
      <h3 className="text-olive-700 font-medad mb-8 text-6xl">
        السلام عليكم يا {first_name}
      </h3>

      <ParentOverviewHeader myChildren={myChildren} />

      <div className="[&>div]:separators-[7.25rem] [&>div]:border-olive-200 grid grid-cols-2 pe-0!">
        <div className="flex flex-col gap-6">
          <h4 className="text-olive-700 mb-6 text-5xl font-bold">
            آخر الكورسات المسجلة
          </h4>

          <div className="grid grid-cols-2 items-center gap-12">
            {myChildren.length > 0 ? (
              myChildren.map((c, i) => (
                <ChildCard key={c.id} index={i} child={c} />
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
        </div>

        <EnrollmentsList
          enrollments={allEnrollments}
          listStyles="max-h-[calc(100dvh-55rem)]"
        />
      </div>
    </div>
  );
}
