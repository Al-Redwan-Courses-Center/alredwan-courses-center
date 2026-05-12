import {
  DashboardNavItem,
  getDashboardNavItems,
} from "@/components/layout/dashboard/dashboardNavConfig";
import NavLink from "@/components/ui/navigation/NavLink";
import { UserEntity } from "@/types/auth";

function isBottomNavItem(item: DashboardNavItem) {
  return !item.nestedNavLinks?.length;
}

export default function DashboardBottomNav({
  role,
}: {
  role: UserEntity["role"];
}) {
  const navLinks = getDashboardNavItems(role);

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#D0D7CF] bg-[#EAEDEA] px-3 py-2 min-[1000px]:hidden">
      <ul
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${navLinks.length}, minmax(0, 1fr))`,
        }}
      >
        {navLinks.map((navLink, i) => (
          <li key={`${navLink.href}-${i}`}>
            <NavLink
              variant="dashboard"
              size="medium"
              href={navLink.href}
              precision="startsWith"
              boldWidth={false}
              icon={navLink.icon}
              className="flex translate-x-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xl min-[400px]:text-2xl shadow-none"
              wrapperStyles="flex-col gap-1 [&_svg]:h-6 min-[400px]:[&_svg]:h-8 [&_svg]:w-auto"
            >
              <span className="text-[1.2rem] min-[400px]:text-xl text-center leading-tight">{navLink.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
