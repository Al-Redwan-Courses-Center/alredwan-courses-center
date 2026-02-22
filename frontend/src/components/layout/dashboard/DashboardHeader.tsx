import LeftDecoration from "@/assets/dashboard/navbar-decoration-left.svg";
import RightDecoration from "@/assets/dashboard/navbar-decoration-right.svg";
import Logo from "@/assets/logo.svg";
import { getUser } from "@/actions/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import Avatar from "@/components/ui/Avatar";
import NavLink from "@/components/ui/navigation/NavLink";
import Image from "next/image";

export default async function DashboardHeader() {
  const { first_name, image, role } = await getUser();

  return (
    <div className="relative z-50 col-span-2 flex items-center bg-gray-100 py-2 ps-112 pe-200">
      <Image
        src={RightDecoration}
        alt="Decorative Illustration"
        className="absolute right-0 -bottom-22"
        draggable={false}
      />

      <LogoutButton variant="primary" size="small" className="me-35">
        تسجيل الخروج
      </LogoutButton>

      <div className="me-auto flex items-center gap-10">
        <Avatar
          src={image}
          alt={`صورة ${first_name}`}
          className="h-20 w-auto"
          fallbackClassName="border-olive-300 border-3"
        />
        <span className="text-olive-700 text-4xl">
          {role === "instructor" && "أخ"} {first_name}
        </span>
      </div>

      <NotificationsDrawer className="me-18">
        <span className="text-right">+1 إشعار</span>
      </NotificationsDrawer>

      <NavLink
        href="/"
        variant="landing"
        canActivate={false}
        boldWidth={false}
        className="relative z-200"
      >
        <Image src={Logo} alt="AlRedwan Logo" draggable={false} />
      </NavLink>

      <Image
        src={LeftDecoration}
        alt="Decorative Illustration"
        className="absolute -bottom-54 left-0"
        draggable={false}
      />
    </div>
  );
}
