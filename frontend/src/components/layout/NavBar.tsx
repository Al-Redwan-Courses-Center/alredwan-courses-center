import NavLink from "@/components/ui/NavLink";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Logo from "@/assets/logo.svg";

export default function NavBar() {
  return (
    <nav className="shadow-soft tablet:hidden sticky top-0 z-100 flex h-26 w-full items-center justify-between bg-gray-100/80 px-128 backdrop-blur-md">
      <div className="tablet:hidden grid grid-cols-2 items-center gap-4">
        <Button variant="primary" size="small" href="/login">
          تسجيل دخول
        </Button>

        <Button variant="secondary" size="small" href="/signup">
          إنشاء حساب
        </Button>
      </div>

      <ul className="text-primary tablet:hidden absolute left-1/2 flex transform-[translateX(-50%)] items-center gap-8 text-[14px]">
        <NavLink variant="landing" href="/">
          الرئيسية
        </NavLink>
        <NavLink variant="landing" href="/courses">
          الدورات
        </NavLink>
        <NavLink variant="landing" href="/about">
          عن الواحة
        </NavLink>
        <NavLink variant="landing" href="/activities">
          الأنشطة
        </NavLink>
        <NavLink variant="landing" href="/contact-us">
          تواصل معنا
        </NavLink>
      </ul>

      <NavLink
        variant="landing"
        href="/"
        className="tablet:mr-auto flex items-center gap-3"
        boldWidth={false}
        canActivate={false}
      >
        <Image alt="Logo" src={Logo} />
      </NavLink>
    </nav>
  );
}
