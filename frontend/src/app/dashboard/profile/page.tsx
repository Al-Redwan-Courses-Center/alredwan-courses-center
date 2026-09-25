import { Calendar, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getUser } from "@/actions/auth";
import ChangePasswordForm from "@/components/dashboard/profile/ChangePasswordForm";
import ProfileImageUploader from "@/components/dashboard/profile/ProfileImageUploader";
import Button from "@/components/ui/Button";
import { getFullImageUrl } from "@/lib/image-utils";

export default async function ProfilePage() {
  const roleMapping = {
    parent: "ولي أمر",
    admin: "مدير",
    supervisor: "مشرف",
    instructor: "معلم",
    student: "طالب",
  };
  const user = await getUser();
  return (
    <div className="relative z-20 flex h-full flex-col gap-12 overflow-auto px-16 pt-64 pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-olive-700 font-medad text-6xl">الملف الشخصي</h3>
        <Button
          href="/dashboard/profile/edit"
          variant="secondary"
          className="px-10 py-4 text-2xl"
        >
          تعديل البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="shadow-soft flex flex-col items-center gap-6 rounded-[3rem_0] border border-white/40 bg-white/60 p-10 backdrop-blur-md lg:col-span-1">
          <ProfileImageUploader
            initialImage={getFullImageUrl(user.profile_image)}
            firstName={user.first_name || ""}
          />

          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <div className="text-olive-600 bg-olive-50 mt-2 flex items-center justify-center gap-2 rounded-full px-4 py-1">
              <ShieldCheck size={18} />
              <span className="text-xl font-bold">
                {roleMapping[user.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="flex flex-col gap-10 lg:col-span-2">
          <div className="shadow-soft rounded-[0_3rem] border border-white/40 bg-white/60 p-10 backdrop-blur-md">
            <h4 className="text-olive-800 border-olive-100 mb-8 border-b pb-4 text-3xl font-bold">
              البيانات الأساسية
            </h4>

            <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
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
                value={
                  user.address && user.address.trim() !== ""
                    ? user.address
                    : "غير محدد"
                }
              />
            </div>
          </div>

          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 rounded-2xl bg-gray-50 p-3 shadow-inner">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xl font-semibold text-gray-500">{label}</span>
        <span className="mt-1 text-2xl font-bold text-gray-800">{value}</span>
      </div>
    </div>
  );
}
