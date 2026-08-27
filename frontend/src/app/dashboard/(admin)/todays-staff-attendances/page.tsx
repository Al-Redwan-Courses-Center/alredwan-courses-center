export const dynamic = "force-dynamic";

import { getTodaysAttendances } from "@/actions/admin-attendances";
import { getUser } from "@/actions/auth";
import AdminAttendancesView from "@/components/dashboard/admin/AdminAttendancesView";

export default async function Page() {
  const attendances = await getTodaysAttendances();
  const user = await getUser();

  return (
    <div className="px-16 py-26">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">
          السلام عليكم يا {user?.first_name || "مديرنا الغالي"}
        </span>
        <span>حضور و مهام اليوم</span>
      </div>

      <AdminAttendancesView
        initialAttendances={attendances}
        hideDateFilter={true}
      />
    </div>
  );
}
