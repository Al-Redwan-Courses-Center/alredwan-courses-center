import MoneyIcon from "@/components/icons/MoneyIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

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
    <div className="text-olive-300 not-first:border-olive-200 separators-[4.25rem] grid grid-cols-[auto_1fr] grid-rows-2 gap-x-7 gap-y-4 text-4xl font-bold">
      <Icon
        className={cn(
          "drop-shadow-soft row-span-full h-20 w-auto self-center max-[1000px]:row-span-1 max-[1000px]:row-start-2 max-[1000px]:h-10",
          iconClassName,
        )}
      />
      <span className="self-end max-[1000px]:col-span-2">{label}</span>
      <span className="text-olive-500 whitespace-nowrap tabular-nums">
        {value}
        {suffix && <span className="ms-1">{suffix}</span>}
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
      iconClassName: "h-auto w-28",
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
    <div className="mb-14 grid h-auto w-full grid-cols-[repeat(3,minmax(0,auto))] gap-y-8 rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-8 py-8 shadow-inner min-[1000px]:h-76 min-[1000px]:w-6/10 min-[1000px]:grid-cols-[repeat(3,minmax(0,auto))] min-[1000px]:gap-y-0 min-[1000px]:px-14 min-[1000px]:py-10">
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
