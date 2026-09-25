import { getInstructors } from "@/actions/admin-instructors";
import { getOnlySupervisorSchedules } from "@/actions/admin-schedules";
import { getUser } from "@/actions/auth";
import SupervisorScheduleView from "@/components/dashboard/admin/SupervisorScheduleView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const [dbSchedules, instructors, user] = await Promise.all([
    getOnlySupervisorSchedules(),
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
          <span>جدول الإشراف الأسبوعي</span>
        </div>
      </div>

      <SupervisorScheduleView
        initialSchedules={dbSchedules}
        instructors={instructors}
      />
    </div>
  );
}
