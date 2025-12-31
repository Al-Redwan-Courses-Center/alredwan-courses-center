import Button from "@/components/ui/Button";
import NavLink from "@/components/ui/NavLink";
import Image from "next/image";
import Logo from "@/assets/logo.svg";

export default function MobileNavBar() {
  return (
    <nav className="shadow-soft tablet:flex sticky bottom-0 z-100 hidden h-26 w-full items-center justify-between bg-gray-100/80 backdrop-blur-md">
      <div className="tablet:hidden grid grid-cols-2 items-center gap-4">
        <Button variant="primary" size="small" href="/login">
          تسجيل دخول
        </Button>

        <Button variant="secondary" size="small" href="/signup">
          إنشاء حساب
        </Button>
      </div>

      <ul className="text-primary flex w-full items-center justify-center gap-8 text-[14px] [&>a_div]:flex [&>a_div]:flex-col [&>a_div]:items-center">
        <NavLink href="/">
          <div>
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span>الرئيسية</span>
          </div>
        </NavLink>

        <NavLink href="/courses">
          <div>
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span>الدورات</span>
          </div>
        </NavLink>

        <NavLink href="/about">
          <div>
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span>عن الواحة</span>
          </div>
        </NavLink>

        <NavLink href="/activities">
          <div>
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span>الأنشطة</span>
          </div>
        </NavLink>

        <NavLink href="/contact-us">
          <div>
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span>تواصل معنا</span>
          </div>
        </NavLink>

        <NavLink href="/login">
          <div>
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span>تسجيل الدخول</span>
          </div>
        </NavLink>
      </ul>
    </nav>
  );
}
