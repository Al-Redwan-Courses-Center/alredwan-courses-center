import type { Metadata } from "next";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "عن الواحة",
};

export default function Page() {
  return <ComingSoon title="عن الواحة" />;
}
