import ClipboardIcon from "@/components/icons/ClipboardIcon";
import PanelsIcon from "@/components/icons/PanelsIcon";
import PersonIcon from "@/components/icons/PersonIcon";
import Button from "@/components/ui/Button";
import NavLink from "@/components/ui/NavLink";

export default function DashboardNavSidebar() {
  return (
    <div className="mt-4 flex flex-col items-center gap-16 rounded-tl-4xl bg-[#EAEDEA] p-13">
      <div className="aspect-square h-auto w-46 rounded-full bg-gray-500"></div>

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

        <Button
          variant="primary"
          size="small"
          className="bg-olive-300 self-start"
        >
          تسجيل الخروج
        </Button>
      </ul>
    </div>
  );
}
