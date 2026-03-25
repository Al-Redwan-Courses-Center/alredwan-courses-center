import ActiveCourseIcon from "@/components/icons/ActiveCourseIcon";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import {
  getChildAttendanceRate,
  getChildOngoingEnrollments,
  getChildPendingEnrollments,
} from "@/dev-data/db";
import { getUser } from "@/actions/auth";
import {
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import React, { ComponentProps } from "react";

function DataPoint({
  label,
  icon: Icon,
  value,
}: {
  label: string;
  icon: React.FC<ComponentProps<"svg">>;
  value: number;
}) {
  return (
    <div className="text-olive-300 not-first:border-olive-200 separators-[4.25rem] grid grid-cols-[auto_1fr] grid-rows-2 gap-x-7 gap-y-4 text-4xl font-bold">
      <Icon className="drop-shadow-soft row-span-full h-20 w-auto self-center max-[1000px]:row-span-1 max-[1000px]:row-start-2 max-[1000px]:h-10" />
      <span className="self-end max-[1000px]:col-span-2">{label}</span>
      <span className="text-olive-500">{value}</span>
    </div>
  );
}

export default async function StudentOverviewHeader({
  childId = "",
}: {
  childId?: string;
}) {
  const { role } = await getUser();
  let myActiveCourses: any[], myPendingCourses: any[], attendanceRate: number;

  if (role === "parent") {
    // TODO(api): Child-specific enrollment data is not available yet.
    myActiveCourses = getChildOngoingEnrollments(childId);
    myPendingCourses = getChildPendingEnrollments(childId);
    attendanceRate = getChildAttendanceRate(childId);
  } else {
    const [enrollments, requests] = await Promise.all([
      getMyEnrollments(),
      getMyEnrollmentRequests(),
    ]);
    myActiveCourses = enrollments.filter((e) => e.status === "active");
    myPendingCourses = requests.filter((e) => e.status === "pending");

    // TODO(api): Replace with real attendance rate endpoint.
    attendanceRate = enrollments.length
      ? Math.round(
          enrollments.reduce(
            (acc, enrollment) => acc + (enrollment.completion_percentage || 0),
            0,
          ) / enrollments.length,
        )
      : 0;
  }

  const dataPoints = [
    {
      label: "الدورات النشطة",
      icon: ActiveCourseIcon,
      value: myActiveCourses.length,
    },
    {
      label: "الطلبات المعلقة",
      icon: PendingTransactionIcon,
      value: myPendingCourses.length,
    },
    {
      label: "معدل الحضور",
      icon: CheckBadgeIcon,
      value: attendanceRate,
    },
  ];

  return (
    <div className="mb-14 grid h-auto w-full grid-cols-[repeat(3,minmax(0,auto))] gap-y-8 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-8 py-8 shadow-inner min-[1000px]:h-76 min-[1000px]:w-6/10 min-[1000px]:grid-cols-[repeat(3,minmax(0,auto))] min-[1000px]:gap-y-0 min-[1000px]:px-14 min-[1000px]:py-10">
      {dataPoints.map((dataPoint) => (
        <DataPoint
          key={dataPoint.label}
          label={dataPoint.label}
          icon={dataPoint.icon}
          value={dataPoint.value}
        />
      ))}
    </div>
  );
}
