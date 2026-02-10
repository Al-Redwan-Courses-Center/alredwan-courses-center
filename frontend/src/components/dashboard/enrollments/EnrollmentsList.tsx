import EnrollmentCard from "@/components/dashboard/enrollments/EnrollmentCard";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function EnrollmentsList({
  enrollments,
  wrapperStyles,
  listStyles,
}: {
  enrollments: any[];
  listStyles?: string;
  wrapperStyles?: string;
}) {
  const childNames = [
    ...new Set(enrollments.map((e) => e.child.name.split(" ")[0])),
  ];

  return (
    <div className={cn("flex flex-col ps-0! pb-10 *:ps-29", wrapperStyles)}>
      <h4 className="text-olive-700 mb-6 text-5xl font-bold">
        آخر الطلبات {childNames.length === 1 && `ل${childNames[0]}`}
      </h4>

      <div
        className={cn(
          "flex flex-col gap-10 overflow-y-auto pe-16 pt-6 pb-10",
          listStyles,
        )}
      >
        {enrollments.length > 0 ? (
          enrollments.map((e) => <EnrollmentCard key={e.id} enrollment={e} />)
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-4 py-40 text-4xl font-bold">
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
