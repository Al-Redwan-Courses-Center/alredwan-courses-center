import DefaultUser from "@/assets/images/default-user.svg";
import { getUser } from "@/actions/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import ClipboardIcon from "@/components/icons/ClipboardIcon";
import PanelsIcon from "@/components/icons/PanelsIcon";
import PersonIcon from "@/components/icons/PersonIcon";
import NavLink from "@/components/ui/NavLink";
import Image from "next/image";

export default async function DashboardNavSidebar() {
  const { image, first_name } = await getUser();

  return (
    <div className="mt-4 flex flex-col items-center gap-16 rounded-tl-4xl p-13">
      {!!image ? (
        <div className="border-olive-300 relative aspect-square h-auto w-46 overflow-clip rounded-full border-4">
          <Image
            src={image}
            alt={`صورة ${first_name}`}
            fill
            className="h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <Image
          src={DefaultUser}
          alt="Default User Illustration"
          className="border-olive-300 aspect-square h-auto w-46 rounded-full border-4 object-cover"
          draggable={false}
        />
      )}

      <ul className="flex h-full w-full flex-col gap-10">
        <NavLink
          variant="dashboard"
          size="medium"
          href="/dashboard/todays-schedule"
          icon={<PanelsIcon />}
        >
          جميع الدورات
        </NavLink>

        <NavLink
          variant="dashboard"
          size="medium"
          href="/dashboard/my-courses"
          icon={<ClipboardIcon />}
        >
          محاضرات اليوم
        </NavLink>

        <NavLink
          variant="dashboard"
          size="medium"
          href="/dashboard/profile"
          icon={<PersonIcon />}
          className="mb-auto"
        >
          الملف الشخصي
        </NavLink>

        <LogoutButton
          variant="primary"
          size="small"
          className="bg-olive-300 self-start"
        >
          تسجيل الخروج
        </LogoutButton>
      </ul>
    </div>
  );
}
