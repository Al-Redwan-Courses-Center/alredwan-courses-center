import {
  getAllSchedules,
  getSeasons,
  Season,
  WeeklySchedule,
} from "@/actions/admin-schedules";
import { getAllCourses } from "@/actions/courses";
import { getInstructors } from "@/actions/admin-instructors";
import SeasonSchedulesView from "@/components/dashboard/admin/SeasonSchedulesView";
import { getUser } from "@/actions/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const seasons: Season[] = await getSeasons();
  const activeSeason = seasons.find((s) => s.is_active);

  // Real schedules from API
  const dbSchedules = await getAllSchedules({
    season: activeSeason?.id,
  });

  const [courses, instructors, user] = await Promise.all([
    getAllCourses(),
    getInstructors(),
    getUser(),
  ]);

  return (
    <div className="flex flex-col px-16 py-26">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">
          السلام عليكم يا {user?.first_name || "مديرنا الغالي"}
        </span>
        <div className="flex items-end justify-between">
          <span>الجداول الزمنية</span>
          <span className="text-2xl text-gray-400">
            الموسم الحالي: {activeSeason?.name || "غير محدد"}
          </span>
        </div>
      </div>

      <SeasonSchedulesView
        initialSchedules={dbSchedules}
        courses={courses}
        instructors={instructors}
      />
    </div>
  );
}
