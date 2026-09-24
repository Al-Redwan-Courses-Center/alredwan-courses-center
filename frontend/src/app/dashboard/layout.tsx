import type { ReactNode } from "react";
import { getUser } from "@/actions/auth";
import { getMeWithStatus } from "@/actions/profile";
import SessionExpired from "@/components/auth/SessionExpired";
import DashboardBottomNav from "@/components/layout/dashboard/DashboardBottomNav";
import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import DashboardNavSidebar from "@/components/layout/dashboard/DashboardNavSidebar";
import { getFullImageUrl } from "@/lib/image-utils";

export default async function Layout({ children }: { children: ReactNode }) {
  const sessionUser = await getUser();
  const { user: dbUser, unauthorized } = await getMeWithStatus();

  // The backend rejected the session's token (expired, revoked, or issued by
  // another environment): sign out instead of rendering a broken dashboard.
  if (unauthorized) return <SessionExpired />;

  const user = dbUser || sessionUser;

  const { first_name, role } = user;
  const rawImage = user.profile_image || user.image;
  const userImage = getFullImageUrl(rawImage);

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] min-[1000px]:grid-cols-[auto_1fr]">
      <DashboardHeader firstName={first_name} image={userImage} role={role} />
      <DashboardNavSidebar
        firstName={first_name}
        image={userImage}
        role={role}
      />
      <div className="no-scrollbar relative min-h-0 w-full max-w-full overflow-y-auto bg-[linear-gradient(179deg,#FFF_0.75%,#93A494_480.3%)] max-[1000px]:pb-[120px]">
        {children}
      </div>
      <DashboardBottomNav role={role} />
    </div>
  );
}
