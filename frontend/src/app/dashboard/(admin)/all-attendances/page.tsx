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

  const dummyData = [
    ...Array.from({ length: 6 }).flatMap((_, i) => [
      {
        id: i * 4 + 1,
        instructor: 101,
        instructor_name: `محمد أحمد علي ${i + 1}`,
        lecture_info: { lecture_title: "شرح كتاب التوحيد", course_title: "العقيدة للمبتدئين" },
        date: "2026-05-16",
        check_in_time: "2026-05-16T15:50:00+03:00",
        check_out_time: "2026-05-16T18:10:00+03:00",
        scheduled_check_in_time: "16:00:00",
        scheduled_check_out_time: "18:00:00",
        status: "present" as const,
        status_display: "حاضر",
        attendance_type: "lecture" as const,
        attendance_type_display: "محاضرة",
        rating: 9,
      },
      {
        id: i * 4 + 2,
        instructor: 102,
        instructor_name: `أحمد محمود ${i + 1}`,
        lecture_info: null,
        date: "2026-05-16",
        check_in_time: "2026-05-16T08:15:00+03:00",
        check_out_time: null,
        scheduled_check_in_time: "08:00:00",
        scheduled_check_out_time: "14:00:00",
        status: "late" as const,
        status_display: "متأخر",
        attendance_type: "supervision" as const,
        attendance_type_display: "إشراف",
        rating: null,
      },
      {
        id: i * 4 + 3,
        instructor: 103,
        instructor_name: `محمود حسن ${i + 1}`,
        lecture_info: { lecture_title: "حفظ جزء عم", course_title: "تحفيظ القرآن الكريم" },
        date: "2026-05-16",
        check_in_time: null,
        check_out_time: null,
        scheduled_check_in_time: "17:00:00",
        scheduled_check_out_time: "19:00:00",
        status: "absent" as const,
        status_display: "غائب",
        attendance_type: "lecture" as const,
        attendance_type_display: "محاضرة",
        rating: null,
      },
      {
        id: i * 4 + 4,
        instructor: 104,
        instructor_name: `عبدالله مصطفى ${i + 1}`,
        lecture_info: { lecture_title: "تجويد", course_title: "القرآن الكريم" },
        date: "2026-05-16",
        check_in_time: null,
        check_out_time: null,
        scheduled_check_in_time: "20:00:00",
        scheduled_check_out_time: "22:00:00",
        status: "not_started" as const,
        status_display: "لم يبدأ",
        attendance_type: "lecture" as const,
        attendance_type_display: "محاضرة",
        rating: null,
      }
    ])
  ];

  return (
    <div className="px-16 py-26 flex flex-col">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">السلام عليكم يا شيخ بنداري</span>
        <div className="flex justify-between items-end">
          <span>سجل الحضور والغياب</span>
          <span className="text-2xl text-gray-400">التاريخ: {date}</span>
        </div>
      </div>

      <AdminAttendancesView initialAttendances={attendances.length > 0 ? attendances : dummyData} />
    </div>
  );
}
