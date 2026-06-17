import { StaffAttendanceListItem } from "@/types/entities/staff-attendance";
import { SupervisorSchedule } from "@/types/entities/schedules";
import { toHindiDigits, formatTime } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

interface InstructorTimetableViewProps {
  attendances: StaffAttendanceListItem[];
  supervisorSchedules: SupervisorSchedule[];
  isSupervisor: boolean;
}

export default function InstructorTimetableView({
  attendances,
  supervisorSchedules,
  isSupervisor,
}: InstructorTimetableViewProps) {
  return (
    <div className="flex flex-col gap-32">
      {/* Lectures Timetable */}
      <section>
        <h3 className="text-2xl font-medad text-olive-800 mb-16 border-r-4 border-olive-500 pr-12">
          جدول المحاضرات والجلسات
        </h3>
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-olive-100/50 text-olive-900">
                <th className="p-16 font-bold">المحاضرة / الدورة</th>
                <th className="p-16 font-bold">التاريخ</th>
                <th className="p-16 font-bold">وقت البدء</th>
                <th className="p-16 font-bold">وقت الانتهاء</th>
                <th className="p-16 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length > 0 ? (
                attendances.map((attendance, index) => (
                  <tr 
                    key={attendance.id} 
                    className="border-t border-olive-100/30 hover:bg-olive-50/50 transition-colors"
                  >
                    <td className="p-16">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{attendance.lecture_info?.lecture_title}</span>
                        <span className="text-sm text-gray-500">{attendance.lecture_info?.course_title}</span>
                      </div>
                    </td>
                    <td className="p-16 text-gray-700">{toHindiDigits(attendance.date)}</td>
                    <td className="p-16 text-gray-700">{toHindiDigits(formatTime(attendance.scheduled_check_in_time) || "")}</td>
                    <td className="p-16 text-gray-700">{toHindiDigits(formatTime(attendance.scheduled_check_out_time) || "")}</td>
                    <td className="p-16">
                      <StatusBadge>{attendance.status_display}</StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-32 text-center text-gray-500 italic">
                    لا توجد محاضرات مجدولة حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supervisor Schedule (Conditional) */}
      {isSupervisor && (
        <section>
          <h3 className="text-2xl font-medad text-olive-800 mb-16 border-r-4 border-olive-500 pr-12">
            جدول الإشراف الأسبوعي
          </h3>
          <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-olive-100/50 text-olive-900">
                  <th className="p-16 font-bold">اليوم</th>
                  <th className="p-16 font-bold">وقت البدء</th>
                  <th className="p-16 font-bold">وقت الانتهاء</th>
                  <th className="p-16 font-bold">فترة السماح</th>
                </tr>
              </thead>
              <tbody>
                {supervisorSchedules.length > 0 ? (
                  supervisorSchedules.map((schedule) => (
                    <tr 
                      key={schedule.id} 
                      className="border-t border-olive-100/30 hover:bg-olive-50/50 transition-colors"
                    >
                      <td className="p-16 font-bold text-gray-800">{schedule.day_display}</td>
                      <td className="p-16 text-gray-700">{toHindiDigits(formatTime(schedule.start_time) || "")}</td>
                      <td className="p-16 text-gray-700">{toHindiDigits(formatTime(schedule.end_time) || "")}</td>
                      <td className="p-16 text-gray-700">
                        {toHindiDigits(schedule.grace_period_minutes.toString())} دقيقة
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-32 text-center text-gray-500 italic">
                      لا يوجد جدول إشراف محدد حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
