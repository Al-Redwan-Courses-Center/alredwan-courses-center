import ActiveCourseIcon from "@/components/icons/ActiveCourseIcon";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import React, { ComponentProps } from "react";

function DataPoint({
  label,
  icon: Icon,
  value,
  isPercentage,
}: {
  label: string;
  icon: React.FC<ComponentProps<"svg">>;
  value: number;
  isPercentage?: boolean;
}) {
  return (
    <div className="text-olive-300 not-first:border-olive-200 separators-[4.25rem] max-[1000px]:separators-6 grid grid-cols-[auto_1fr] grid-rows-2 gap-x-7 gap-y-4 text-4xl font-bold">
      <Icon className="drop-shadow-soft row-span-full h-20 w-auto self-center max-[1000px]:row-span-1 max-[1000px]:row-start-2 max-[1000px]:h-10" />
      <span className="self-end max-[1000px]:col-span-2">{label}</span>
      <span className="text-olive-500">{value}{isPercentage && "%"}</span>
    </div>
  );
}

export default function StudentOverviewHeader({
  activeCoursesCount,
  pendingRequestsCount,
  attendanceRate,
}: {
  activeCoursesCount: number;
  pendingRequestsCount: number;
  attendanceRate: number;
}) {
  const dataPoints = [
    {
      label: "الدورات النشطة",
      icon: ActiveCourseIcon,
      value: activeCoursesCount,
    },
    {
      label: "الطلبات المعلقة",
      icon: PendingTransactionIcon,
      value: pendingRequestsCount,
    },
    {
      label: "معدل الحضور",
      icon: CheckBadgeIcon,
      value: attendanceRate,
      isPercentage: true,
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
          isPercentage={dataPoint.isPercentage}
        />
      ))}
    </div>
  );
}
