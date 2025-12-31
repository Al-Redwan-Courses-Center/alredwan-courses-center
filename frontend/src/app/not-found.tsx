import Footer from "@/components/layout/Footer";
import MobileNavBar from "@/components/layout/MobileNavBar";
import NavBar from "@/components/layout/NavBar";
import NotFound from "@/components/feedback/NotFound";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "صفحة غير موجودة",
};

export default function Page() {
  return (
    <div className="tablet:grid-rows-[1fr_auto_auto] grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <NavBar />
      <NotFound />
      <Footer />
      <MobileNavBar />
    </div>
  );
}
