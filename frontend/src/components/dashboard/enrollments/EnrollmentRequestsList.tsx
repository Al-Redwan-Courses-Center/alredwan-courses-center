import EnrollmentRequestCard from "@/components/dashboard/enrollments/EnrollmentRequestCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import InfoTooltip from "@/components/ui/InfoTooltip";

import Refresh from "@/components/ui/Refresh";
import { cn } from "@/lib/utils";

const emptyActionClassName =
  "!shadow-[0_4px_14px_rgba(47,61,56,0.2)] hover:!shadow-[0_6px_18px_rgba(47,61,56,0.24)]";

export default function EnrollmentRequestsList({
  enrollments,
  wrapperStyles,
  listStyles,
}: {
  enrollments: any[];
  listStyles?: string;
  wrapperStyles?: string;
}) {
  const hasEnrollments = enrollments.length > 0;
  const childNames = [
    ...new Set(
      enrollments
        .map((e) => {
          if (e.child?.name) return e.child.name.split(" ")[0];
          if (e.participant_name) return e.participant_name.split(" ")[0];
          return null;
        })
        .filter(Boolean),
    ),
  ];

  return (
    <div className={cn("flex flex-col ps-0! pb-10 *:ps-29", wrapperStyles)}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="dashboard-section-title -mb-1">
          آخر الطلبات {childNames.length === 1 && `ل${childNames[0]}`}
        </h2>
        <div className="flex items-center gap-4 text-white">
          <Refresh />
          <InfoTooltip content="طلبات الاشتراك قيد الانتظار يتم معالجتها حالياً من قبل إدارة المسجد. للاستفسار، يرجى التواصل مع إدارة المسجد مباشرة." />
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-10 pe-16",
          hasEnrollments
            ? cn("overflow-y-auto pt-6 pb-10", listStyles)
            : "min-h-80 justify-center py-12",
        )}
      >
        {hasEnrollments ? (
          enrollments.map((e) => (
            <EnrollmentRequestCard
              key={e.id}
              enrollmentRequest={e}
              childName={e.child?.name}
            />
          ))
        ) : (
          <EmptyState
            title="لا توجد طلبات تسجيل!"
            description="اشترك في دورتك الأولى الآن!"
            action={
              <Button
                href="/dashboard/courses"
                size="small"
                className={emptyActionClassName}
              >
                جميع الدورات
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
