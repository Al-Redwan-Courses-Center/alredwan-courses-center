import { getUser } from "@/actions/auth";
import EditProfileForm from "@/components/dashboard/profile/EditProfileForm";
import { protect } from "@/actions/auth";
import { getMe } from "@/actions/profile";

export default async function EditProfilePage() {
  await protect(["parent", "student", "instructor", "admin"]);
  const sessionUser = await getUser();
  const user = await getMe() || sessionUser;

  return (
    <div className="px-4 md:px-8 min-[1000px]:px-16 pt-32 md:pt-64 flex flex-col gap-10 h-full overflow-auto pb-20 relative z-20 w-full">
      <h3 className="text-olive-700 font-medad text-6xl text-right w-full">تعديل الملف الشخصي</h3>
      
      <div className="w-full lg:w-3/4">
        <EditProfileForm user={{
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          dob: user.dob,
          address: user.address,
          role: user.role,
          image: user.image
        }} />
      </div>
    </div>
  );
}
