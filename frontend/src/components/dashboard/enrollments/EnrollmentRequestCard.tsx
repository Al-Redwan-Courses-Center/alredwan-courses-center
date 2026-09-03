import InfoTooltip from "@/components/ui/InfoTooltip";
import EnrollmentRequestCancelButton from "@/components/enrollments/EnrollmentRequestCancelButton";
import CalendarIcon from "@/components/icons/CalendarIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import ClientLocalDateTime from "@/components/ui/ClientLocalDateTime";
import { cn } from "@/lib/utils";
import type { EnrollmentRequestListItem } from "@/types/entities";

const statusMap = {
  pending: {
    label: "معلق",
    color: cn("bg-blue-300"),
    description: "طلب الحجز قيد الانتظار لمراجعة الإدارة وتأكيد الدفع.",
  },
  processing: {
    label: "قيد المراجعة",
    color: cn("bg-gray-300 text-gray-950"),
    description: "تتم مراجعة بيانات الطلب وإتمام إجراءات القبول حالياً.",
  },
  rejected: {
    label: "تم الرفض",
    color: cn("bg-red-300"),
    description: "تم رفض طلب الحجز من قبل إدارة المركز.",
  },
  accepted: {
    label: "تم القبول",
    color: cn("bg-olive-300"),
    description: "تم قبول الحجز وتفعيل الاشتراك بالدورة بنجاح.",
  },
};

export default function EnrollmentRequestCard({
  enrollmentRequest,
  childName,
}: {
  enrollmentRequest: EnrollmentRequestListItem;
  childName?: string;
}) {
  const courseTitle = enrollmentRequest.course_name;
  const displayPrice =
    enrollmentRequest.price ?? enrollmentRequest.course_price;
  const tagShapeClassName =
    "rounded-[0.5rem_0] px-3 py-2 font-bold text-[1.3rem]";

  const currentStatus = statusMap[enrollmentRequest.status] || {
    label: enrollmentRequest.status,
    color: "bg-gray-300",
    description: "حالة الحجز غير محددة",
  };

  return (
    <div className="shadow-soft relative flex flex-col rounded-[2rem_0] bg-gray-50 py-6 ps-15 pe-22! text-2xl transition-colors hover:bg-gray-100">
      <div className="mb-5 flex items-center gap-4 flex-wrap">
        <span className="text-[1.6rem] font-bold">{courseTitle}</span>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              tagShapeClassName,
              "text-gray-100",
              currentStatus.color,
            )}
          >
            {currentStatus.label}
          </span>
          <InfoTooltip content={currentStatus.description} />
        </div>

        {childName && (
          <span
            className={cn(tagShapeClassName, "bg-olive-500/10 text-olive-700")}
          >
            {childName}
          </span>
        )}
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
