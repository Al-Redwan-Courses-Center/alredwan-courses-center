"use client";

import EnrollmentRequestCancelButton from "@/components/enrollments/EnrollmentRequestCancelButton";
import CalendarIcon from "@/components/icons/CalendarIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import ClientLocalDateTime from "@/components/ui/ClientLocalDateTime";
import Accordion from "@/components/ui/accordion/Accordion";
import AccordionHeader from "@/components/ui/accordion/AccordionHeader";
import AccordionItem from "@/components/ui/accordion/AccordionItem";
import { cn } from "@/lib/utils";
import { EnrollmentRequestListItem } from "@/types/entities";

const statusMap = {
  pending: { label: "معلق", color: cn("bg-blue-300") },
  processing: { label: "قيد المراجعة", color: cn("bg-gray-300 text-gray-950") },
  rejected: { label: "تم الرفض", color: cn("bg-red-300") },
  accepted: { label: "تم القبول", color: cn("bg-olive-300") },
};

interface StudentOverviewEnrollmentRequestsAccordionProps {
  enrollmentRequests: EnrollmentRequestListItem[];
}

export default function StudentOverviewEnrollmentRequestsAccordion({
  enrollmentRequests,
}: StudentOverviewEnrollmentRequestsAccordionProps) {
  return (
    <Accordion className="gap-4" allowMultiple>
      {enrollmentRequests.map((enrollmentRequest) => {
        const displayPrice =
          enrollmentRequest.price ?? enrollmentRequest.course_price;

        return (
          <AccordionItem
            key={enrollmentRequest.id}
            id={enrollmentRequest.id}
            rounded="all"
            header={(isOpen) => (
              <AccordionHeader isOpen={isOpen} className="gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <MoneyIcon className="text-olive-500 h-6 w-6 shrink-0" />
                  <span className="text-olive-700 truncate text-2xl font-bold">
                    {enrollmentRequest.course_name}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-[0.5rem_0] px-3 py-1.5 text-lg font-bold text-gray-100",
                    statusMap[enrollmentRequest.status].color,
                  )}
                >
                  {statusMap[enrollmentRequest.status].label}
                </span>
              </AccordionHeader>
            )}
            headerClassName="h-auto min-h-16 py-4"
            contentClassName="space-y-4"
          >
            <div className="flex items-center gap-2 text-xl text-gray-700">
              <CalendarIcon className="text-olive-500 h-6 w-6" />
              <span>تم الطلب في</span>
              <span className="font-bold">
                <ClientLocalDateTime iso={enrollmentRequest.created_at} />
              </span>
            </div>

            <div className="flex items-center gap-2 text-xl text-gray-700">
              <MoneyIcon className="text-olive-500 h-6 w-6" />
              <span className="font-bold">{displayPrice} جنيه</span>
            </div>

            {enrollmentRequest.status === "pending" && (
              <div className="pt-1">
                <EnrollmentRequestCancelButton
                  enrollmentRequestId={enrollmentRequest.id}
                />
              </div>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
