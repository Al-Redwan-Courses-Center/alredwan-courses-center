import EnrollmentRequestCard from "@/components/dashboard/enrollments/EnrollmentRequestCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
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
      <h2 className="dashboard-section-title -mb-1">
        آخر الطلبات {childNames.length === 1 && `ل${childNames[0]}`}
      </h2>

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
            <EnrollmentRequestCard key={e.id} enrollmentRequest={e} />
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
