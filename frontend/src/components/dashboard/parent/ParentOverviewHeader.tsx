import MoneyIcon from "@/components/icons/MoneyIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import {
  getAllMyChildrenEnrollments,
  getPendingEnrollments,
} from "@/dev-data/db";
import { cn, toHindiDigits } from "@/lib/utils";

const dataPointWrapperStyles = cn(
  "text-olive-300 not-first:border-olive-200 separators-[4.25rem] grid grid-cols-[auto_1fr] grid-rows-2 gap-x-7 gap-y-4 text-4xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-20 w-auto self-center",
);

export default function ParentOverviewHeader({
  myChildren,
}: {
  myChildren: any[];
}) {
  const myChildrenEnrollments = getAllMyChildrenEnrollments();
  const myChildrenPendingEnrollments = getPendingEnrollments();

  const totalPaid = myChildrenEnrollments.reduce(
    (acc, cur) => acc + cur.course.price,
    0,
  );

  // console.log(myChildrenEnrollments);

  return (
    <div>
      <div className="mb-14 grid h-76 w-6/10 grid-cols-[repeat(3,minmax(0,auto))] rounded-[0_0_1.5951rem_1.5951rem] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] px-14 py-10 shadow-inner">
        <div className={dataPointWrapperStyles}>
          <PeopleIcon className={cn(dataPointIconStyles, "h-auto w-28")} />
          <span className="self-end">عدد الأطفال</span>
          <span className="text-olive-500">
            {toHindiDigits(myChildren.length)}
          </span>
        </div>

        <div className={dataPointWrapperStyles}>
          <PendingTransactionIcon className={dataPointIconStyles} />
          <span className="self-end">الطلبات المعلقة</span>
          <span className="text-olive-500">
            {toHindiDigits(myChildrenPendingEnrollments.length)}
          </span>
        </div>

        <div className={dataPointWrapperStyles}>
          <MoneyIcon className={dataPointIconStyles} />
          <span className="self-end">إجمالي المدفوعات</span>
          <span className="text-olive-500">
            {toHindiDigits(totalPaid)} جنيه
          </span>
        </div>
      </div>
    </div>
  );
}
