import { getUser } from "@/actions/auth";
import LecturesTable from "@/components/lectures/LectureTable";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "محاضرات اليوم",
};

export default async function Page() {
  const { first_name } = await getUser();

  return (
    <div className="px-16 pt-15">
      <h1 className="text-olive-700 font-medad mb-14 text-6xl">
        السلام عليكم يا أخ {first_name}
      </h1>

      <Suspense>
        <LecturesTable />
      </Suspense>
    </div>
  );
}
