import LecturesTable from "@/components/lectures/LecturesTable";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="relative bg-[linear-gradient(179deg,#FFF_0.75%,#93A494_480.3%)] px-16 pt-15">
      <h1 className="text-olive-700 font-medad mb-14 text-6xl">
        السلام عليكم يا أخ مسعد
      </h1>

      <Suspense>
        <LecturesTable />
      </Suspense>
    </div>
  );
}
