import {
  listSupervisorInstructors,
  listSupervisorSchedules,
} from "@/actions/supervisor-schedules";
import SupervisorSchedulesView from "@/components/dashboard/admin/SupervisorSchedulesView";

export default async function Page() {
  const [schedules, instructors] = await Promise.all([
    listSupervisorSchedules(),
    listSupervisorInstructors(),
  ]);

  return (
    <div className="px-16 py-26">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">إدارة الجداول</span>
        <span>جداول الإشراف الأسبوعية</span>
      </div>

      <SupervisorSchedulesView schedules={schedules} instructors={instructors} />
    </div>
  );
}
