import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import DashboardNavSidebar from "@/components/layout/dashboard/DashboardNavSidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-screen grid-cols-[auto_1fr] grid-rows-[auto_1fr]">
      <DashboardHeader />
      <DashboardNavSidebar />
      {children}
    </div>
  );
}
