import { getUser } from "@/actions/auth";
import EditProfileForm from "@/components/dashboard/profile/EditProfileForm";
import { protect } from "@/actions/auth";
import { getMe } from "@/actions/profile";

export default async function EditProfilePage() {
  await protect(["parent", "student", "instructor", "admin"]);
  const sessionUser = await getUser();
  const user = (await getMe()) || sessionUser;

  return (
    <div className="relative z-20 flex h-full w-full flex-col gap-10 overflow-auto px-10 pt-64 pb-20 md:px-16">
      <h3 className="text-olive-700 font-medad w-full text-right text-6xl">
        تعديل الملف الشخصي
      </h3>

      <div className="w-full lg:w-3/4">
        <EditProfileForm user={user} />
      </div>
    </div>
  );
}
