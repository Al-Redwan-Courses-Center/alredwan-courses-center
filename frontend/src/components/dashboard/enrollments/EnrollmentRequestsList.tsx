import EnrollmentRequestCard from "@/components/dashboard/enrollments/EnrollmentRequestCard";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
          <div className="bg-olive-300 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          </div>
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-800 transition-transform hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
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
