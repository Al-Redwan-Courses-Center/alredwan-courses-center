import EnrollmentRequestCard from "@/components/dashboard/enrollments/EnrollmentRequestCard";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Refresh from "@/components/ui/Refresh";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function EnrollmentRequestsList({
  enrollments,
  wrapperStyles,
  listStyles,
}: {
  enrollments: any[];
  listStyles?: string;
  wrapperStyles?: string;
}) {
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
        <h4 className="text-olive-700 text-5xl font-bold">
          طلبات الاشتراك
        </h4>
        <div className="flex items-center gap-4 text-white">
          <Refresh />
          <InfoTooltip content="طلبات الاشتراك قيد الانتظار يتم معالجتها حالياً من قبل إدارة المعهد. للاستفسار، يرجى التواصل مع إدارة المعهد مباشرة." />
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-10 overflow-y-auto pe-16 pt-6 pb-10",
          listStyles,
        )}
      >
        {enrollments.length > 0 ? (
          enrollments.map((e) => (
            <EnrollmentRequestCard 
              key={e.id} 
              enrollmentRequest={e} 
              childName={e.child?.name || e.participant_name}
            />
          ))
        ) : (
          <div className="my-auto flex w-full flex-col items-center justify-center gap-4 text-4xl font-bold">
            <span className="text-red-800">لا توجد دورات مسجلة!</span>
            <span className="mb-10">اشترك في دورتك الأولى الآن!</span>
            <Link href="/dashboard/courses">
              <Button size="small">جميع الدورات</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
