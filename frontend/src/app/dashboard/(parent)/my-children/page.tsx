import { getParentChildren } from "@/actions/user";
import ChildRow from "@/components/dashboard/parent/ChildRow";
import { Fragment } from "react/jsx-runtime";

import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default async function Page() {
  const myChildren = await getParentChildren();

  if (myChildren.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-6">
        <div className="bg-olive-50 p-10 rounded-full">
          <Plus size={80} className="text-olive-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-olive-700 font-medad text-5xl">لا يوجد أطفال مضافون بعد</h3>
          <p className="text-gray-600 text-2xl">ابدأ بإضافة أطفالك لتتمكن من إلحاقهم بالدورات التدريبية</p>
        </div>
        <Button href="/dashboard/my-children/new" className="bg-olive-500 hover:bg-olive-600 text-white px-12 py-5 rounded-[0.5rem_2rem] font-bold text-3xl flex items-center gap-4 shadow-lg transition-transform hover:scale-105">
          إضافة أول طفل الآن
        </Button>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100dvh-10%)] overflow-auto px-6 pt-8 pb-9 flex flex-col h-full">
      <div className="flex-1">
        {myChildren.map((c, i) => (
          <Fragment key={c.id}>
            <ChildRow child={c} index={i} />

            {i + 1 < myChildren.length && (
              <div className="bg-olive-100 mx-auto my-10 h-px w-2/3" />
            )}
          </Fragment>
        ))}
      </div>
      
      <div className="mt-8 flex justify-start">
        <Button href="/dashboard/my-children/new" className="bg-[#94A396] hover:bg-[#7d8c80] text-white px-8 py-3 rounded-[0.5rem_2rem] font-bold text-2xl flex items-center gap-2">
          اضافة طفل جديد
        </Button>
      </div>
    </div>
  );
}
