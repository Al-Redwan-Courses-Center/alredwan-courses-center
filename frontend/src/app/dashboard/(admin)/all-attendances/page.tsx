import { getAttendances } from "@/actions/admin-attendances";
import AdminAttendancesView from "@/components/dashboard/admin/AdminAttendancesView";
import { format } from "date-fns";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const date = (searchParams.date as string) || format(new Date(), "yyyy-MM-dd");
  
  const attendances = await getAttendances({
    date,
    instructor: searchParams.instructor ? Number(searchParams.instructor) : undefined,
    status: searchParams.status as string,
    attendance_type: searchParams.attendance_type as string,
    season: searchParams.season ? Number(searchParams.season) : undefined,
  });

  return (
    <div className="px-16 py-26 flex flex-col">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">السلام عليكم يا شيخ بنداري</span>
        <div className="flex justify-between items-end">
          <span>سجل الحضور والغياب</span>
          <span className="text-2xl text-gray-400">التاريخ: {date}</span>
        </div>
      </div>

      <AdminAttendancesView initialAttendances={attendances} />
    </div>
  );
}
