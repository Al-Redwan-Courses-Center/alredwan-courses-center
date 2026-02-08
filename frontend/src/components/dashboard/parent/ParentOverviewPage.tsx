import { getUser } from "@/actions/auth";
import ParentOverviewHeader from "@/components/dashboard/parent/ParentOverviewHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default async function ParentOverviewPage() {
  const { first_name } = await getUser();

  return (
    <div className="ps-16 pt-15 *:pe-16">
      <h3 className="text-olive-700 font-medad mb-8 text-6xl">
        السلام عليكم يا {first_name}
      </h3>

      <ParentOverviewHeader />

      <div className="[&>div]:separators-[7.25rem] [&>div]:border-olive-200 grid grid-cols-2 pe-0!">
        <div className="flex flex-col gap-6">
          <h4 className="text-olive-700 text-5xl font-bold">
            آخر الكورسات المسجلة
          </h4>

          <div className="flex grow items-center gap-12">
            <div className="flex w-full flex-col items-center justify-center gap-4 py-40 text-4xl font-bold">
              <span className="text-red-800">لا توجد دورات مسجلة!</span>
              <span className="mb-10">اشترك في دورة جديدة الآن!</span>
              <Link href="/dashboard/courses">
                <Button size="small">جميع الدورات</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col ps-0! *:ps-29">
          <h4 className="text-olive-700 text-5xl font-bold">آخر الطلبات</h4>

          <div className="flex max-h-[calc(100dvh-44rem)] flex-col gap-10 overflow-y-auto pe-16 pt-6 pb-10">
            <div className="flex w-full flex-col items-center justify-center gap-4 py-40 text-4xl font-bold">
              <span className="text-red-800">لا توجد دورات مسجلة!</span>
              <span className="mb-10">اشترك في دورتك الأولى الآن!</span>
              <Link href="/dashboard/courses">
                <Button size="small">جميع الدورات</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
