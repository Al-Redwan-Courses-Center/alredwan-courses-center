import LeftDecoration from "@/assets/dashboard/navbar-decoration-left.svg";
import RightDecoration from "@/assets/dashboard/navbar-decoration-right.svg";
import Logo from "@/assets/logo.svg";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import Button from "@/components/ui/Button";
import NavLink from "@/components/ui/NavLink";
import Image from "next/image";

export default function DashboardHeader() {
  return (
    <div className="relative z-50 col-span-2 flex items-center bg-gray-100 py-2 ps-112 pe-200">
      <Image
        src={RightDecoration}
        alt="Decorative Illustration"
        className="absolute right-0 -bottom-22"
        draggable={false}
      />

      <Button variant="primary" size="small" className="me-35">
        تسجيل الخروج
      </Button>

      <div className="me-auto flex items-center gap-10">
        <div className="aspect-square h-20 w-auto rounded-full bg-gray-500"></div>
        <span className="text-olive-700 text-4xl">أخ مسعد</span>
      </div>

      <NotificationsDrawer className="me-18">
        <span className="text-right">إشعارات اليوم</span>
      </NotificationsDrawer>

      <NavLink
        href="/dashboard/todays-schedule"
        variant="landing"
        canActivate={false}
        boldWidth={false}
        className="relative z-200"
      >
        <Image src={Logo} alt="AlRedwan Logo" />
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
