import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardHeader />
      <div className="relative min-h-0 overflow-hidden bg-[linear-gradient(179deg,#FFF_0.75%,#93A494_480.3%)]">
        {children}
      </div>
    </>
  );
}
