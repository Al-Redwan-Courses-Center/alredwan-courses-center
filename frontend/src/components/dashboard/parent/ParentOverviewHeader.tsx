import type { ComponentProps, FC } from "react";
import MoneyIcon from "@/components/icons/MoneyIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { cn } from "@/lib/utils";

function DataPoint({
  label,
  icon: Icon,
  value,
  suffix,
  iconClassName,
}: {
  label: string;
  icon: FC<ComponentProps<"svg">>;
  value: number | string;
  suffix?: string;
  iconClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-2 gap-x-5 gap-y-2 text-2xl font-bold text-olive-300 min-[1000px]:gap-x-7 min-[1000px]:gap-y-4 min-[1000px]:text-4xl sm:text-3xl">
      <Icon
        className={cn(
          "drop-shadow-soft row-span-full h-14 w-auto self-center min-[1000px]:h-20",
          iconClassName,
        )}
      />
      <span className="self-end text-lg opacity-90 min-[1000px]:text-2xl sm:text-xl">
        {label}
      </span>
      <span className="text-3xl whitespace-nowrap text-olive-500 tabular-nums min-[1000px]:text-5xl sm:text-4xl">
        {value}
        {suffix && <span className="ms-1.5 text-xl sm:text-2xl">{suffix}</span>}
      </span>
    </div>
  );
}

export default function ParentOverviewHeader({
  myChildrenCount,
  pendingEnrollmentsCount,
  totalPaid,
}: {
  myChildrenCount: number;
  pendingEnrollmentsCount: number;
  totalPaid: number;
}) {
  const paidAmount = Math.round(totalPaid || 0);

  const dataPoints = [
    {
      label: "عدد الأطفال",
      icon: PeopleIcon,
      value: myChildrenCount,
      iconClassName: "h-auto w-20 min-[1000px]:w-28",
    },
    {
      label: "الطلبات المعلقة",
      icon: PendingTransactionIcon,
      value: pendingEnrollmentsCount,
    },
    {
      label: "إجمالي المدفوعات",
      icon: MoneyIcon,
      value: paidAmount.toLocaleString("en-US"),
      suffix: "جنيه",
    },
  ];

  return (
    <div className="mb-14 grid h-auto w-full max-w-5xl grid-cols-1 gap-y-8 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-6 py-8 shadow-inner min-[1000px]:grid-cols-3 min-[1000px]:gap-x-8 min-[1000px]:px-12 min-[1000px]:py-10">
      {dataPoints.map((dataPoint) => (
        <DataPoint
          key={dataPoint.label}
          label={dataPoint.label}
          icon={dataPoint.icon}
          value={dataPoint.value}
          suffix={dataPoint.suffix}
          iconClassName={dataPoint.iconClassName}
        />
      ))}
    </div>
  );
}
