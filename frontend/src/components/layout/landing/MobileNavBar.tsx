import {
  type LucideIcon,
  Compass,
  GraduationCap,
  Home,
  LogIn,
  Sparkles,
  User,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import AuthModal from "@/components/auth/AuthModal";
import NavLink from "@/components/ui/navigation/NavLink";

function MobileNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <NavLink
      variant="landing"
      href={href}
      boldWidth={false}
      wrapperStyles="flex-col gap-1.5 items-center justify-center h-full w-full"
    >
      <Icon className="h-9 w-9 stroke-[1.5]" />
      <span className="text-[1.3rem] leading-none whitespace-nowrap md:text-[1.4rem]">
        {label}
      </span>
    </NavLink>
  );
}

export default async function MobileNavBar() {
  const session = await getServerSession(authConfig);

  return (
    <nav className="shadow-soft tablet:flex sticky bottom-0 z-1000 hidden h-28 w-full items-center justify-between border-t border-gray-200 bg-gray-100/95 px-6 backdrop-blur-md">
      <ul className="text-primary flex h-full w-full items-center justify-around gap-1">
        <li className="flex h-full flex-1 items-center justify-center">
          <MobileNavLink href="/" label="الرئيسية" icon={Home} />
        </li>
        <li className="flex h-full flex-1 items-center justify-center">
          <MobileNavLink
            href="/#courses"
            label="الدورات"
            icon={GraduationCap}
          />
        </li>
        <li className="flex h-full flex-1 items-center justify-center">
          <MobileNavLink href="/#about" label="عن الواحة" icon={Compass} />
        </li>
        <li className="flex h-full flex-1 items-center justify-center">
          <MobileNavLink href="/#activities" label="الأنشطة" icon={Sparkles} />
        </li>
        <li className="flex h-full flex-1 items-center justify-center">
          {session?.user ? (
            <MobileNavLink href="/dashboard" label="لوحة التحكم" icon={User} />
          ) : (
            <AuthModal
              trigger={
                <button className="text-olive-500 relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 text-center hover:font-semibold">
                  <LogIn className="h-9 w-9 stroke-[1.5]" />
                  <span className="text-[1.3rem] leading-none whitespace-nowrap md:text-[1.4rem]">
                    تسجيل الدخول
                  </span>
                </button>
              }
            />
          )}
        </li>
      </ul>
    </nav>
  );
}
