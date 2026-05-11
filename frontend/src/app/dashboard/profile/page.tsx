import { getUser } from "@/actions/auth";
import { User, Phone, Mail, Calendar, MapPin, ShieldCheck, Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import ProfileImageUploader from "@/components/dashboard/profile/ProfileImageUploader";
import { getMe } from "@/actions/profile";
import { getFullImageUrl } from "@/lib/image-utils";

export default async function ProfilePage() {
  const sessionUser = await getUser();
  const user = await getMe() || sessionUser;

  return (
    <div className="px-16 pt-64 flex flex-col gap-12 h-full overflow-auto pb-20 relative z-20">
      <div className="flex justify-between items-center">
        <h3 className="text-olive-700 font-medad text-6xl">الملف الشخصي</h3>
        <Button href="/dashboard/profile/edit" variant="secondary" className="px-10 py-4 text-2xl">
          تعديل البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white/60 backdrop-blur-md p-10 rounded-[3rem_0] shadow-soft flex flex-col items-center gap-6 border border-white/40">
          <ProfileImageUploader 
            initialImage={getFullImageUrl(user.profile_image)} 
            firstName={user.first_name || ""} 
          />
          
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
            <div className="mt-2 flex items-center justify-center gap-2 text-olive-600 bg-olive-50 px-4 py-1 rounded-full">
              <ShieldCheck size={18} />
              <span className="text-xl font-bold">
                {user.role === "parent" ? "ولي أمر" : "طالب"}
              </span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md p-10 rounded-[0_3rem] shadow-soft border border-white/40">
          <h4 className="text-3xl font-bold text-olive-800 mb-8 pb-4 border-b border-olive-100">البيانات الأساسية</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
            <InfoItem 
              icon={<Phone className="text-olive-500" />} 
              label="رقم الهاتف" 
              value={user.phone_number1} 
            />
            <InfoItem 
              icon={<Mail className="text-olive-500" />} 
              label="البريد الإلكتروني" 
              value={user.email || "غير محدد"} 
            />
            <InfoItem 
              icon={<Calendar className="text-olive-500" />} 
              label="تاريخ الميلاد" 
              value={user.dob} 
            />
            <InfoItem 
              icon={<MapPin className="text-olive-500" />} 
              label="العنوان" 
              value={user.address && user.address.trim() !== "" ? user.address : "غير محدد"} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gray-50 rounded-2xl shadow-inner mt-1">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500 text-xl font-semibold">{label}</span>
        <span className="text-2xl font-bold text-gray-800 mt-1">{value}</span>
      </div>
    </div>
  );
}
