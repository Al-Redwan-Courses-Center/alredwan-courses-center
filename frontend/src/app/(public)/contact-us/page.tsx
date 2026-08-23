import type { Metadata } from "next";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "تواصل معنا",
};

export default function Page() {
  return <ComingSoon title="تواصل معنا" />;
}
