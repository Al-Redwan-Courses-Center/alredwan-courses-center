import NavLink from "@/components/nav/NavLink";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Logo from "@/assets/logo.svg";

export default function NavBar() {
  return (
    <nav className="shadow-soft sticky top-0 z-100 flex h-26 w-full items-center justify-between bg-gray-100/80 px-128 backdrop-blur-md">
      <div className="grid grid-cols-2 items-center gap-4">
        <Button variant="primary" size="sm" href="#">
          تسجيل دخول
        </Button>

        <Button variant="secondary" size="sm" href="#">
          إنشاء حساب
        </Button>
      </div>

      <ul className="text-primary absolute left-1/2 hidden transform-[translateX(-50%)] items-center gap-8 text-[14px] md:flex">
        <NavLink active href="#">
          الرئيسية
        </NavLink>
        <NavLink href="#">الكورسات</NavLink>
        <NavLink href="#">عن الأكاديمية</NavLink>
        <NavLink href="#">الأنشطة</NavLink>
        <NavLink href="#">تواصل</NavLink>
      </ul>

      <NavLink href="/" className="flex items-center gap-3">
        <Image alt="Logo" src={Logo} />
      </NavLink>
    </nav>
  );
}
