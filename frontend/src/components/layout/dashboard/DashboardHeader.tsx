import LeftDecoration from "@/assets/dashboard/navbar-decoration-left.svg";
import RightDecoration from "@/assets/dashboard/navbar-decoration-right.svg";
import Logo from "@/assets/logo.svg";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import Avatar from "@/components/ui/Avatar";
import NavLink from "@/components/ui/navigation/NavLink";
import { UserEntity } from "@/types/auth";
import Image from "next/image";

export default function DashboardHeader({
  firstName,
  image,
  role,
}: {
  firstName: string;
  image: string | null | undefined;
  role: UserEntity["role"];
}) {
  return (
    <div className="relative z-40 col-span-1 flex items-center bg-gray-100 py-1 px-4 md:px-8 min-[1000px]:col-span-2 min-[1000px]:ps-112 min-[1000px]:pe-200 shadow-sm">
      <Image
        src={RightDecoration}
        alt="Decorative Illustration"
        className="absolute right-0 -bottom-12 hidden min-[1000px]:block pointer-events-none"
        draggable={false}
      />

      <LogoutButton
        variant="primary"
        size="small"
        className="me-8 min-[1000px]:me-35"
      >
        تسجيل الخروج
      </LogoutButton>

      <div className="me-auto flex items-center gap-3 min-[1000px]:gap-10">
        <Avatar
          src={image}
          alt={`صورة ${firstName}`}
          className="h-14 w-14 shrink-0 min-[1000px]:h-20 min-[1000px]:w-20"
          fallbackClassName="border-olive-300 border-3"
        />
        <span className="text-olive-700 text-2xl min-[1000px]:text-4xl whitespace-nowrap">
          {role === "instructor" && "أخ"} {firstName}
        </span>
      </div>

      <NotificationsDrawer className="me-8 min-[1000px]:me-18">
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
        className="absolute -bottom-24 left-0 hidden min-[1000px]:block pointer-events-none"
        draggable={false}
      />
    </div>
  );
}
