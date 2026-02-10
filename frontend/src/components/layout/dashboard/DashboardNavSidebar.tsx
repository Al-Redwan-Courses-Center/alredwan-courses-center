import { getUser } from "@/actions/auth";
import DefaultUser from "@/assets/images/default-user.svg";
import LogoutButton from "@/components/auth/LogoutButton";
import AllCoursesIcon from "@/components/icons/AllCoursesIcon";
import ClipboardIcon from "@/components/icons/ClipboardIcon";
import MyCoursesIcon from "@/components/icons/MyCoursesIcon";
import OverviewIcon from "@/components/icons/OverviewIcon";
import PanelsIcon from "@/components/icons/PanelsIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import PersonIcon from "@/components/icons/PersonIcon";
import NavLink from "@/components/ui/navigation/NavLink";
import ResourceCollapsibleNavList from "@/components/ui/navigation/ResourceCollapsibleNavList";
import Image from "next/image";
import { ReactNode } from "react";

interface NavLink {
  label: string;
  href: string;
  icon?: ReactNode;
  nestedNavLinks?: NavLink[];
  className?: string;
}

const roleMap: Record<string, NavLink[]> = {
  instructor: [
    {
      label: "محاضرات اليوم",
      href: "/dashboard/todays-schedule",
      icon: <PanelsIcon />,
    },

    {
      label: "جميع الدورات",
      href: "/dashboard/my-courses",
      icon: <ClipboardIcon />,
      nestedNavLinks: [
        {
          href: "lectures",
          label: "المحاضرات",
        },
        {
          href: "",
          label: "تفاصيل الدورة",
        },
        {
          href: "enrollments",
          label: "الحجوزات",
        },
      ],
    },

    {
      label: "الملف الشخصي",
      href: "/dashboard/profile",
      icon: <PersonIcon />,
      className: "mb-auto",
    },
  ],

  parent: [
    {
      label: "نظرة عامة",
      href: "/dashboard/overview",
      icon: <OverviewIcon />,
    },

    {
      label: "أطفالي",
      href: "/dashboard/my-children",
      icon: <PeopleIcon className="h-auto w-[2.4rem]" />,
      nestedNavLinks: [
        {
          href: "",
          label: "نظرة عامة",
        },
        {
          label: "الدورات",
          href: "courses",
        },
        {
          label: "الملف الشخصي",
          href: "profile",
        },
      ],
    },

    {
      label: "جميع الدورات",
      href: "/dashboard/courses",
      icon: <AllCoursesIcon />,
    },

    {
      label: "الملف الشخصي",
      href: "/dashboard/profile",
      icon: <PersonIcon />,
      className: "mb-auto",
    },
  ],

  student: [
    {
      label: "نظرة عامة",
      href: "/dashboard/overview",
      icon: <OverviewIcon />,
    },

    {
      label: "دوراتي",
      href: "/dashboard/my-courses",
      icon: <MyCoursesIcon />,
    },

    {
      label: "جميع الدورات",
      href: "/dashboard/courses",
      icon: <AllCoursesIcon />,
    },

    {
      label: "الملف الشخصي",
      href: "/dashboard/profile",
      icon: <PersonIcon />,
      className: "mb-auto",
    },
  ],
};

function renderNavLink(
  navLink: (typeof roleMap)["instructor" & "student"][number],
  i: number,
) {
  if (!!navLink.nestedNavLinks?.length)
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

export default async function DashboardNavSidebar() {
  const { image, first_name, role } = await getUser();

  // const navLinks = roleMap[role as keyof typeof roleMap];
  const navLinks = roleMap[role];

  return (
    <div className="mt-4 flex flex-col items-center gap-16 rounded-tl-4xl bg-[#EAEDEA] p-13">
      {/* 
      //
      // MARK: Image
      //
      */}
      {!!image ? (
        <div className="border-olive-300 relative aspect-square h-auto w-46 overflow-clip rounded-full border-4">
          <Image
            src={image}
            alt={`صورة ${first_name}`}
            fill
            className="h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <Image
          src={DefaultUser}
          alt="Default User Illustration"
          className="border-olive-300 aspect-square h-auto w-46 rounded-full border-4 object-cover"
          draggable={false}
        />
      )}

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
          className="bg-olive-300 self-start"
        >
          تسجيل الخروج
        </LogoutButton>
      </ul>
    </div>
  );
}
