import { ParentChildDetail } from "@/actions/user";
import ActiveCourseIcon from "@/components/icons/ActiveCourseIcon";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import PendingTransactionIcon from "@/components/icons/PendingTransactionIcon";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import CopyToClipboardButton from "@/components/ui/CopyToClipboardButton";
import ItemCard from "@/components/ui/ItemCard";
import ProgressBarWithLabel from "@/components/ui/ProgressBarWithLabel";
import {
  getChildAttendanceRate,
  getChildOngoingEnrollments,
  getChildPendingEnrollments,
} from "@/dev-data/db";
import { cn, getArabicPlural, toHindiDigits } from "@/lib/utils";
import { FunctionComponent, SVGProps } from "react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="relative flex items-center rounded-[1rem_0] bg-gray-100 p-6 font-bold text-gray-500">
      <Icon className="text-olive-300 me-4 h-10 w-auto" />
      <span className="me-auto">{label}</span>
      <div className="absolute inset-y-6 left-6 grid aspect-square w-auto place-items-center rounded-[0.5rem_0] bg-gray-50 shadow-[1px_2px_2.1px_0px_rgba(0,0,0,0.17)]">
        {value}
      </div>
    </div>
  );
}

export default function ChildCard({
  index,
  child,
}: {
  index: number;
  child: ParentChildDetail;
}) {
  // TODO(api): Child-level enrollments/attendance are not available yet.
  const activeCourses = getChildOngoingEnrollments(child.id);
  const pendingEnrollments = getChildPendingEnrollments(child.id);
  const attendanceRate = getChildAttendanceRate(child.id);

  // console.log(activeCourses);
  // console.log(pendingEnrollments);

  return (
    <ItemCard
      shape="square"
      index={index}
      className="bg-gray-50"
      cardHeader={
        <div className="relative grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-x-6">
          <div
            className={cn(
              "relative row-span-full aspect-square h-24 w-auto",
              "overflow-hidden rounded-full bg-gray-100",
            )}
          >
            <Avatar
              src={child.image}
              alt="Child Image"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col pe-30 overflow-hidden">
            <span
              className="text-[1.6rem] font-bold truncate block"
              title={`${child.first_name} ${child.last_name}`}
            >
              {child.first_name} {child.last_name}
            </span>
            <span>
              {child.age}{" "}
              {getArabicPlural(child.age, {
                plural: "سنين",
                singular: "سنة",
                twofer: "سنتين",
              })}
            </span>
          </div>

          <CopyToClipboardButton className="absolute top-4 left-0 rounded-[0_1rem] px-5 py-2 font-black shadow-[0_0.909px_0.909px_0_rgba(0,0,0,0.25),1.591px_1.364px_3.319px_0_rgba(0,0,0,0.25)]!">
            {child.unique_code}
          </CopyToClipboardButton>
        </div>
      }
      cardFooter={
        <div className="flex items-center justify-end">
          <Button
            size="small"
            className="bg-olive-300"
            href={`/dashboard/my-children/${child.id}`}
          >
            عرض لوحة التحكم
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-8 pt-8 pb-12">
        <StatCard
          icon={ActiveCourseIcon}
          label="الدورات النشطة"
          value={toHindiDigits(activeCourses.length)}
        />
        <StatCard
          icon={PendingTransactionIcon}
          label="الطلبات المعلقة"
          value={toHindiDigits(pendingEnrollments.length)}
        />
        <ProgressBarWithLabel
          icon={CheckBadgeIcon}
          label="معدل الحضور"
          progress={attendanceRate}
        />
      </div>
    </ItemCard>
  );
}
