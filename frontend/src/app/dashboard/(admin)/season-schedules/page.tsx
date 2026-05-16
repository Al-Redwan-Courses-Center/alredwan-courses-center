import { getAllSchedules, getSeasons, Season, WeeklySchedule } from "@/actions/admin-schedules";
import SeasonSchedulesView from "@/components/dashboard/admin/SeasonSchedulesView";

export default async function Page() {
  const seasons: Season[] = await getSeasons();
  const activeSeason = seasons.find((s) => s.is_active);
  
  // Real schedules from API
  const dbSchedules = await getAllSchedules({
    season: activeSeason?.id,
  });

  // Dummy schedules for testing the design and pagination
  const dummySchedules: WeeklySchedule[] = [
    { id: 101, weekday: 0, weekday_display: "الأحد", start_time: "10:00:00", end_time: "12:00:00", instructor_name: "الشيخ أحمد محمد", course_name: "تحفيظ القرآن - المستوى الأول", season_name: "رمضان 2026", student_count: 25, type: "lecture" },
    { id: 102, weekday: 1, weekday_display: "الاثنين", start_time: "16:00:00", end_time: "18:00:00", instructor_name: "أستاذ محمود علي", course_name: "إشراف الفترة المسائية", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 103, weekday: 3, weekday_display: "الأربعاء", start_time: "09:00:00", end_time: "11:00:00", instructor_name: "الشيخ إبراهيم حسن", course_name: "تجويد - للمبتدئين", season_name: "رمضان 2026", student_count: 40, type: "lecture" },
    { id: 104, weekday: 4, weekday_display: "الخميس", start_time: "14:00:00", end_time: "15:30:00", instructor_name: "أستاذة سارة محمود", course_name: "إشراف قاعة أ", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 105, weekday: 6, weekday_display: "السبت", start_time: "08:00:00", end_time: "10:00:00", instructor_name: "الشيخ محمد علي", course_name: "تفسير القرآن الكريم", season_name: "رمضان 2026", student_count: 50, type: "lecture" },
    { id: 106, weekday: 0, weekday_display: "الأحد", start_time: "13:00:00", end_time: "15:00:00", instructor_name: "أستاذ كمال حسن", course_name: "إشراف ممر 1", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 107, weekday: 1, weekday_display: "الاثنين", start_time: "19:00:00", end_time: "21:00:00", instructor_name: "الشيخ ياسر عمار", course_name: "فقه العبادات", season_name: "رمضان 2026", student_count: 30, type: "lecture" },
    { id: 108, weekday: 2, weekday_display: "الثلاثاء", start_time: "11:00:00", end_time: "13:00:00", instructor_name: "أستاذ هاني يوسف", course_name: "إشراف المعمل", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 109, weekday: 3, weekday_display: "الأربعاء", start_time: "17:00:00", end_time: "19:00:00", instructor_name: "الشيخ فؤاد شاكر", course_name: "السيرة النبوية", season_name: "رمضان 2026", student_count: 45, type: "lecture" },
    { id: 110, weekday: 4, weekday_display: "الخميس", start_time: "10:00:00", end_time: "12:00:00", instructor_name: "أستاذ خالد وليد", course_name: "إشراف المكتبة", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 111, weekday: 5, weekday_display: "الجمعة", start_time: "14:00:00", end_time: "16:00:00", instructor_name: "الشيخ عادل فوزي", course_name: "خطابة وإلقاء", season_name: "رمضان 2026", student_count: 20, type: "lecture" },
    { id: 112, weekday: 6, weekday_display: "السبت", start_time: "11:00:00", end_time: "12:30:00", instructor_name: "أستاذ منير إبراهيم", course_name: "إشراف الساحة", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 113, weekday: 0, weekday_display: "الأحد", start_time: "16:00:00", end_time: "18:00:00", instructor_name: "الشيخ طارق زيد", course_name: "متن الجزرية", season_name: "رمضان 2026", student_count: 35, type: "lecture" },
    { id: 114, weekday: 1, weekday_display: "الاثنين", start_time: "09:00:00", end_time: "10:30:00", instructor_name: "أستاذ سعيد مرسي", course_name: "إشراف ممر 2", season_name: "رمضان 2026", student_count: 0, type: "supervision" },
    { id: 115, weekday: 2, weekday_display: "الثلاثاء", start_time: "20:00:00", end_time: "22:00:00", instructor_name: "الشيخ حسام بدري", course_name: "تاريخ الإسلام", season_name: "رمضان 2026", student_count: 60, type: "lecture" },
  ];

  const allSchedules = [...dummySchedules, ...dbSchedules];

  return (
    <div className="px-16 py-26 flex flex-col">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">السلام عليكم يا شيخ بنداري</span>
        <div className="flex justify-between items-end">
          <span>الجداول الزمنية</span>
          <span className="text-2xl text-gray-400">الموسم الحالي: {activeSeason?.name || "غير محدد"}</span>
        </div>
      </div>

      <SeasonSchedulesView initialSchedules={allSchedules} />
    </div>
  );
}