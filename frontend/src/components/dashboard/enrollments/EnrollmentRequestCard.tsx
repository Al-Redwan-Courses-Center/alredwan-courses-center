import EnrollmentRequestCancelButton from "@/components/enrollments/EnrollmentRequestCancelButton";
import CalendarIcon from "@/components/icons/CalendarIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import ClientLocalDateTime from "@/components/ui/ClientLocalDateTime";
import { cn } from "@/lib/utils";
import { EnrollmentRequestListItem } from "@/types/entities";

const statusMap = {
  pending: { label: "معلق", color: cn("bg-blue-300") },
  processing: { label: "قيد المراجعة", color: cn("bg-gray-300 text-gray-950") },
  rejected: { label: "تم الرفض", color: cn("bg-red-300") },
  accepted: { label: "تم القبول", color: cn("bg-olive-300") },
};

export default function EnrollmentRequestCard({
  enrollmentRequest,
}: {
  enrollmentRequest: EnrollmentRequestListItem;
}) {
  const courseTitle = enrollmentRequest.course_name;
  const displayPrice =
    enrollmentRequest.price ?? enrollmentRequest.course_price;

  return (
    <div className="shadow-soft relative flex flex-col rounded-[2rem_0] bg-gray-50 py-6 ps-15 pe-22! text-2xl transition-colors hover:bg-gray-100">
      <div className="mb-5 flex items-center gap-4">
        <span className="text-[1.6rem] font-bold">{courseTitle}</span>

        <span
          className={cn(
            "rounded-[0.5rem_0] px-3 py-2.5 font-bold text-gray-100",
            statusMap[enrollmentRequest.status].color,
          )}
        >
          {statusMap[enrollmentRequest.status].label}
        </span>
      </div>

      <div className="flex items-center">
        <CalendarIcon className="text-olive-300 me-3 aspect-square h-8 w-auto" />
        <span className="me-3">تم الطلب في</span>
        <span className="me-10 font-bold">
          <ClientLocalDateTime iso={enrollmentRequest.created_at} />
        </span>

        <div className="flex items-center gap-3">
          <MoneyIcon className="text-olive-300 aspect-square h-8 w-auto" />
          <span className="font-bold">{displayPrice} جنيه</span>
        </div>
      </div>

      {enrollmentRequest.status === "pending" && (
        <EnrollmentRequestCancelButton
          enrollmentRequestId={enrollmentRequest.id}
        />
      )}
    </div>
  );
}
