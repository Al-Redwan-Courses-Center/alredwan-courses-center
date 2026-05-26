import MoneyIcon from "@/components/icons/MoneyIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { cn, toHindiDigits } from "@/lib/utils";

export default function ParentOverviewHeader({
  myChildrenCount,
  pendingEnrollmentsCount,
  totalPaid,
}: {
  myChildrenCount: number;
  pendingEnrollmentsCount: number;
  totalPaid: number;
}) {
  return (
    <div className="mb-12 grid grid-cols-3 gap-8 w-full tablet:grid-cols-1">
      {/* Card 1: Children Count */}
      <div className="flex items-center gap-6 rounded-[2rem_0] border border-olive-100 bg-gray-50/50 p-8 shadow-sm transition-all hover:shadow-md hover:bg-gray-50">
        <div className="w-20 h-20 rounded-full bg-olive-100/50 flex items-center justify-center text-olive-700 shadow-inner">
          <PeopleIcon className="h-10 w-auto" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-gray-500">عدد الأطفال المسجلين</span>
          <span className="text-5xl font-black text-olive-700">
            {toHindiDigits(myChildrenCount)}
          </span>
        </div>
      </div>

      {/* Card 2: Pending Requests */}
      <div className="flex items-center gap-6 rounded-[2rem_0] border border-olive-100 bg-gray-50/50 p-8 shadow-sm transition-all hover:shadow-md hover:bg-gray-50">
        <div className="w-20 h-20 rounded-full bg-olive-100/50 flex items-center justify-center text-olive-700 shadow-inner">
          <PendingTransactionIcon className="h-10 w-auto" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-gray-500">طلبات الاشتراك المعلقة</span>
          <span className="text-5xl font-black text-olive-700">
            {toHindiDigits(pendingEnrollmentsCount)}
          </span>
        </div>
      </div>

      {/* Card 3: Total Paid */}
      <div className="flex items-center gap-6 rounded-[2rem_0] border border-olive-100 bg-gray-50/50 p-8 shadow-sm transition-all hover:shadow-md hover:bg-gray-50">
        <div className="w-20 h-20 rounded-full bg-olive-100/50 flex items-center justify-center text-olive-700 shadow-inner">
          <MoneyIcon className="h-10 w-auto" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-gray-500">إجمالي المدفوعات</span>
          <span className="text-5xl font-black text-olive-700">
            {toHindiDigits(totalPaid)} <span className="text-2xl font-bold text-olive-500">جنيه</span>
          </span>
        </div>
      </div>
    </div>
  );
}
