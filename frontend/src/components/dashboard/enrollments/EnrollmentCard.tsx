import CalendarIcon from "@/components/icons/CalendarIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const statusMap = {
  pending: { label: "معلق", color: cn("bg-blue-300") },
  processing: { label: "قيد المراجعة", color: cn("bg-gray-300 text-gray-950") },
  rejected: { label: "تم الرفض", color: cn("bg-red-300") },
  accepted: { label: "تم القبول", color: cn("bg-olive-300") },
};

export default function EnrollmentCard({ enrollment }: { enrollment: any }) {
  // console.log(enrollment.status);

  return (
    <div className="shadow-soft relative flex flex-col rounded-[2rem_0] bg-gray-50 py-6 ps-15 pe-22! text-2xl transition-colors hover:bg-gray-100">
      <div className="mb-5 flex items-center gap-4">
        <span className="text-[1.6rem] font-bold">
          {enrollment.course.title}
        </span>

        <span
          className={cn(
            "rounded-[0.5rem_0] px-3 py-2.5 font-bold text-gray-100",
            statusMap[enrollment.status as keyof typeof statusMap].color,
          )}
        >
          {statusMap[enrollment.status as keyof typeof statusMap].label}
        </span>
      </div>

      <div className="flex items-center">
        <CalendarIcon className="text-olive-300 me-3 aspect-square h-8 w-auto" />
        <span className="me-3">تم الطلب في</span>
        <span className="me-10 font-bold">
          {formatDate(parseISO(enrollment.date))} -{" "}
          {formatTime(format(enrollment.date, "HH:mm"))}
        </span>

        <div className="flex items-center gap-3">
          <MoneyIcon className="text-olive-300 aspect-square h-8 w-auto" />
          <span className="font-bold">{enrollment.price} جنيه</span>
        </div>
      </div>

      {enrollment.status === "pending" && (
        <button className="hover:text-olive-700 text-olive-300 absolute top-1/2 left-10 -translate-y-[50%] *:transition-colors">
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
