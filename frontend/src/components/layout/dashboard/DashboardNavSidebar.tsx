import LogoutButton from "@/components/auth/LogoutButton";
import {
  type DashboardNavItem,
  getDashboardNavItems,
} from "@/components/layout/dashboard/dashboardNavConfig";
import Avatar from "@/components/ui/Avatar";
import NavLink from "@/components/ui/navigation/NavLink";
import ResourceCollapsibleNavList from "@/components/ui/navigation/ResourceCollapsibleNavList";
import type { UserEntity } from "@/types/auth";

function renderNavLink(navLink: DashboardNavItem, i: number) {
  if (navLink.nestedNavLinks?.length)
    return (
      <ResourceCollapsibleNavList
        key={i}
        nestedNavLinks={navLink.nestedNavLinks}
        rootHref={navLink.href}
        rootIcon={navLink.icon}
        rootLabel={navLink.label}
      />
    );

  return (
    <NavLink
      key={i}
      variant="dashboard"
      size="medium"
      href={navLink.href}
      boldWidth={false}
      icon={navLink.icon}
      className={navLink.className}
    >
      {navLink.label}
    </NavLink>
  );
}

export default function DashboardNavSidebar({
  firstName,
  image,
  role,
}: {
  firstName: string;
  image: string | null | undefined;
  role: UserEntity["role"];
}) {
  const navLinks = getDashboardNavItems(role);

  return (
    <div className="mt-4 flex flex-col items-center gap-16 rounded-tl-4xl bg-[#EAEDEA] p-13 max-[1000px]:hidden">
      {/*
      //
      // MARK: Image
      //
      */}
      <Avatar
        src={image}
        alt={`صورة ${firstName}`}
        className="border-olive-300 aspect-square h-44 w-44 shrink-0 border-4"
      />

      {/* 
      //
      // MARK: NavLinks
      //
      */}
      <ul className="flex h-full w-full flex-col gap-10">
        {navLinks.map(renderNavLink)}

        {/* 
        //
        // MARK: LOGOUT
        //
        */}

        <LogoutButton
          variant="primary"
          size="small"
          className="bg-olive-300 mt-auto self-start"
        >
          تسجيل الخروج
        </LogoutButton>
      </ul>
    </div>
  );
}
