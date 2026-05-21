import { getUser, protect } from "@/actions/auth";
import { getInstructorTodaysLectures } from "@/actions/lectures";
import TodaysLecturesTable from "@/components/dashboard/instructor/TodaysLecturesTable";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "محاضرات اليوم",
};

export default async function Page() {
  await protect(["instructor"]);

  const { first_name } = await getUser();
  const { lectures } = (await getInstructorTodaysLectures()) || {};

  return (
    <div className="px-16 pt-15">
      <h1 className="dashboard-greeting mb-14">
        السلام عليكم يا أخ {first_name}
      </h1>

      <Suspense>
        <TodaysLecturesTable todaysLectures={lectures} />
      </Suspense>
    </div>
  );
}
