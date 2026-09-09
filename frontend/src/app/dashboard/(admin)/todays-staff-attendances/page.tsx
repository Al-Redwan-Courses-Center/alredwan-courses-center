export const dynamic = "force-dynamic";

import { getUser } from "@/actions/auth";
import { getTodaysAttendances } from "@/actions/admin-attendances";
import AdminAttendancesView from "@/components/dashboard/admin/AdminAttendancesView";

export default async function Page() {
  const [user, attendances] = await Promise.all([
    getUser(),
    getTodaysAttendances(),
  ]);

  const greetingName = user.first_name || "Admin";

  return (
    <div className="px-16 py-26">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">السلام عليكم يا {greetingName}</span>
        <span>حضور و مهام اليوم</span>
      </div>

      <AdminAttendancesView
        initialAttendances={attendances}
        hideDateFilter={true}
      />
    </div>
  );
}
