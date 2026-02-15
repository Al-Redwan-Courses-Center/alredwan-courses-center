import Button from "@/components/ui/Button";
import NavLink from "@/components/ui/navigation/NavLink";
import Image from "next/image";
import Logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/auth/AuthModal";

const navlinksMap = {
  landing: [
    {
      href: "/",
      label: "الرئيسية",
    },
    {
      href: "/courses",
      label: "الدورات",
    },
    {
      href: "/about",
      label: "عن الواحة",
    },
    {
      href: "/activities",
      label: "الأنشطة",
    },
    {
      href: "/contact-us",
      label: "تواصل معنا",
    },
    // {
    //   href: "/login",
    //   label: "تسجيل الدخول",
    // },
  ],
};

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <NavLink variant="landing" href={href} wrapperStyles={cn("h-full")}>
      <div className="relative flex h-full flex-col items-center text-center">
        <Image src={Logo} alt="Logo" className="h-auto w-10" />
        <span className="whitespace-nowrap">{label}</span>
      </div>
    </NavLink>
  );
}

export default function MobileNavBar() {
  const navLinks = navlinksMap.landing;

  return (
    <nav className="shadow-soft tablet:flex sticky bottom-0 z-100 hidden w-full items-center justify-between bg-gray-100/80 px-10 py-2 backdrop-blur-md">
      <div className="tablet:hidden grid grid-cols-2 items-center gap-4">
        <Button variant="primary" size="small" href="/login">
          تسجيل دخول
        </Button>

        <Button variant="secondary" size="small" href="/signup">
          إنشاء حساب
        </Button>
      </div>

      <ul className="text-primary flex w-full gap-8 text-[14px]">
        {navLinks.map((n) => (
          <MobileNavLink href={n.href} label={n.label} key={n.label} />
        ))}
      </ul>

      <AuthModal />
    </nav>
  );
}

// text-olive-500 grid place-items-center text-[1.4rem] leading-normal font-normal transition-all hover:font-semibold after:invisible after:block after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-text)] after:select-none
