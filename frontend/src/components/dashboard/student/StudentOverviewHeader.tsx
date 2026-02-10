import ActiveCourseIcon from "@/components/icons/ActiveCourseIcon";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import { cn } from "@/lib/utils";
import {
  getAttendanceRate,
  getChildAttendanceRate,
  getChildOngoingEnrollments,
  getChildPendingEnrollments,
  getOngoingEnrollments,
  getPendingEnrollments,
} from "@/dev-data/db";
import { getUser } from "@/actions/auth";

const dataPointWrapperStyles = cn(
  "text-olive-300 not-first:border-olive-200 separators-[4.25rem] grid grid-cols-[auto_1fr] grid-rows-2 gap-x-7 gap-y-4 text-4xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-20 w-auto self-center",
);

export default async function StudentOverviewHeader({
  childId = "",
}: {
  childId?: string;
}) {
  const { role } = await getUser();
  let myActiveCourses: any[], myPendingCourses: any[], attendanceRate: number;

  if (role === "parent") {
    myActiveCourses = getChildOngoingEnrollments(childId);
    myPendingCourses = getChildPendingEnrollments(childId);
    attendanceRate = getChildAttendanceRate(childId);
  } else {
    myActiveCourses = getOngoingEnrollments();
    myPendingCourses = getPendingEnrollments();
    attendanceRate = getAttendanceRate();
  }

  return (
    <div className="mb-14 grid h-76 w-6/10 grid-cols-[repeat(3,minmax(0,auto))] rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-14 py-10 shadow-inner">
      <div className={dataPointWrapperStyles}>
        <ActiveCourseIcon className={dataPointIconStyles} />
        <span className="self-end">الكورسات النشطة</span>
        <span className="text-olive-500">{myActiveCourses.length}</span>
      </div>

      <div className={dataPointWrapperStyles}>
        <PendingTransactionIcon className={dataPointIconStyles} />
        <span className="self-end">الطلبات المعلقة</span>
        <span className="text-olive-500">{myPendingCourses.length}</span>
      </div>

      <div className={dataPointWrapperStyles}>
        <CheckBadgeIcon className={dataPointIconStyles} />
        <span className="self-end">معدل الحضور</span>
        <span className="text-olive-500">{attendanceRate}%</span>
      </div>
    </div>
  );
}
