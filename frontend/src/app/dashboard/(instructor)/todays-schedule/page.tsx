import { getUser, protect } from "@/actions/auth";
import { getInstructorTodaysLectures } from "@/actions/lectures";
import { Metadata } from "next";
import TodaysLecturesTable from "./todays-lectures-table";

export const metadata: Metadata = {
  title: "محاضرات اليوم",
};

export default async function Page() {
  await protect(["instructor"]);

  const { first_name } = await getUser();
  const { lectures } = (await getInstructorTodaysLectures()) || {};

  return (
    <div className="px-16 pt-15">
      <h1 className="text-olive-700 font-medad mb-14 text-6xl">
        السلام عليكم يا أخ {first_name}
      </h1>

      <TodaysLecturesTable todaysLectures={lectures} />
    </div>
  );
}
