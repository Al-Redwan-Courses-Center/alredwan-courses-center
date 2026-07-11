import { getUser } from "@/actions/auth";
import { getMe } from "@/actions/profile";
import DashboardBottomNav from "@/components/layout/dashboard/DashboardBottomNav";
import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import DashboardNavSidebar from "@/components/layout/dashboard/DashboardNavSidebar";
import { getFullImageUrl } from "@/lib/image-utils";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const sessionUser = await getUser();
  const dbUser = await getMe();
  const user = dbUser || sessionUser;
  
  const { first_name, role } = user;
  const rawImage = user.profile_image || user.image;
  const userImage = getFullImageUrl(rawImage);

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] min-[1000px]:grid-cols-[auto_1fr]">
      <DashboardHeader firstName={first_name} image={userImage} role={role} />
      <DashboardNavSidebar firstName={first_name} image={userImage} role={role} />
      <div className="relative min-h-0 overflow-y-auto overflow-x-hidden bg-[linear-gradient(179deg,#FFF_0.75%,#93A494_480.3%)] max-[1000px]:pb-[120px] no-scrollbar">
        {children}
      </div>
      <DashboardBottomNav role={role} />
    </div>
  );
}
