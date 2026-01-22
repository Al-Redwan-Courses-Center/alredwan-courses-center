import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import DashboardNavSidebar from "@/components/layout/dashboard/DashboardNavSidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-screen max-h-dvh grid-cols-[auto_1fr] grid-rows-[auto_1fr]">
      <DashboardHeader />
      <DashboardNavSidebar />
      <div className="relative min-h-0 overflow-hidden bg-[linear-gradient(179deg,#FFF_0.75%,#93A494_480.3%)]">
        {children}
      </div>
    </div>
  );
}

// px-16 pt-15
