import { getChildById } from "@/actions/user";
import { notFound } from "next/navigation";
import { ShieldCheck, Calendar, Hash } from "lucide-react";

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const child = await getChildById(childId);

  if (!child) {
    return notFound();
  }

  return (
    <div className="px-16 pt-16 flex flex-col gap-12 h-full overflow-auto pb-20 relative z-20">
      <div className="flex justify-between items-center">
        <h3 className="text-olive-700 font-medad text-6xl">الملف الشخصي</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 bg-white/60 backdrop-blur-md p-10 rounded-[3rem_0] shadow-soft flex flex-col items-center gap-6 border border-white/40">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">{child.first_name} {child.last_name}</h2>
            <div className="mt-2 flex items-center justify-center gap-2 text-olive-600 bg-olive-50 px-4 py-1 rounded-full">
              <ShieldCheck size={18} />
              <span className="text-xl font-bold">
                {child.gender === 'boy' ? 'ابن' : 'ابنة'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-10">
          <div className="bg-white/60 backdrop-blur-md p-10 rounded-[0_3rem] shadow-soft border border-white/40">
            <h4 className="text-3xl font-bold text-olive-800 mb-8 pb-4 border-b border-olive-100">البيانات الأساسية</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
              <InfoItem 
                icon={<Calendar className="text-olive-500" />} 
                label="تاريخ الميلاد" 
                value={child.dob || "-"} 
              />
              <InfoItem 
                icon={<Hash className="text-olive-500" />} 
                label="الكود التعريفي" 
                value={child.unique_code || "-"} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-olive-50 p-3 rounded-xl border border-olive-100">
        {icon}
      </div>
      <div>
        <h5 className="text-sm text-gray-500 mb-1">{label}</h5>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
