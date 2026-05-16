import { getUser } from "@/actions/auth";
import DashboardBottomNav from "@/components/layout/dashboard/DashboardBottomNav";
import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import DashboardNavSidebar from "@/components/layout/dashboard/DashboardNavSidebar";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const { first_name, image, role } = await getUser();

  return (
    <div className="grid h-screen max-h-dvh grid-cols-1 grid-rows-[auto_1fr] min-[1000px]:grid-cols-[auto_1fr]">
      <DashboardHeader firstName={first_name} image={image} role={role} />
      <DashboardNavSidebar firstName={first_name} image={image} role={role} />
      <div className="relative min-h-0 overflow-y-auto bg-[linear-gradient(179deg,#FFF_0.75%,#93A494_480.3%)] max-[1000px]:pb-34 no-scrollbar">
        {children}
      </div>
      <DashboardBottomNav role={role} />
    </div>
  );
}

// px-16 pt-15
