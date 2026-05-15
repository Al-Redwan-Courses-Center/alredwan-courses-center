import MoneyIcon from "@/components/icons/MoneyIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

function StatPoint({
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
    <div
      className={cn(
        "text-olive-300 flex min-w-0 items-center justify-center gap-6 font-bold",
        "not-first:border-olive-200 separators-[4.25rem] px-4",
        "max-[1000px]:separators-2 max-[1000px]:justify-start max-[1000px]:px-0 max-[1000px]:not-first:border-0",
      )}
    >
      <Icon
        className={cn("drop-shadow-soft h-14 w-14 shrink-0", iconClassName)}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <span className="text-2xl leading-none min-[1000px]:text-2xl">
          {label}
        </span>
        <span className="text-olive-500 text-3xl leading-none whitespace-nowrap tabular-nums">
          {value}
          {suffix && <span className="ms-1">{suffix}</span>}
        </span>
      </div>
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

  return (
    <div
      className={cn(
        "mb-10 grid h-auto w-full rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] shadow-inner",
        "grid-cols-1 gap-y-6 px-8 py-8",
        "min-[1000px]:mb-14 min-[1000px]:h-76 min-[1000px]:w-6/10 min-[1000px]:grid-cols-3 min-[1000px]:gap-y-0 min-[1000px]:px-2 min-[1000px]:py-10",
      )}
    >
      <StatPoint
        label="عدد الأطفال"
        icon={PeopleIcon}
        value={myChildrenCount}
        iconClassName="h-14 w-auto"
      />
      <StatPoint
        label="الطلبات المعلقة"
        icon={PendingTransactionIcon}
        value={pendingEnrollmentsCount}
      />
      <StatPoint
        label="إجمالي المدفوعات"
        icon={MoneyIcon}
        value={paidAmount.toLocaleString("en-US")}
        suffix="جنيه"
      />
    </div>
  );
}
