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
        <h3 className="font-medad text-olive-800 border-olive-500 mb-16 border-r-4 pr-12 text-2xl">
          جدول المحاضرات والجلسات
        </h3>
        <div className="overflow-hidden overflow-x-auto rounded-3xl border border-white/20 bg-white/40 shadow-sm backdrop-blur-md">
          <table className="w-full min-w-[800px] border-collapse text-right">
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
                    className="border-olive-100/30 hover:bg-olive-50/50 border-t transition-colors"
                  >
                    <td className="p-16">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">
                          {attendance.lecture_info?.lecture_title}
                        </span>
                        <span className="text-sm text-gray-500">
                          {attendance.lecture_info?.course_title}
                        </span>
                      </div>
                    </td>
                    <td className="p-16 text-gray-700">
                      {toHindiDigits(attendance.date)}
                    </td>
                    <td className="p-16 text-gray-700">
                      {toHindiDigits(
                        formatTime(attendance.scheduled_check_in_time) || "",
                      )}
                    </td>
                    <td className="p-16 text-gray-700">
                      {toHindiDigits(
                        formatTime(attendance.scheduled_check_out_time) || "",
                      )}
                    </td>
                    <td className="p-16">
                      <StatusBadge>{attendance.status_display}</StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-32 text-center text-gray-500 italic"
                  >
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
          <h3 className="font-medad text-olive-800 border-olive-500 mb-16 border-r-4 pr-12 text-2xl">
            جدول الإشراف الأسبوعي
          </h3>
          <div className="overflow-hidden overflow-x-auto rounded-3xl border border-white/20 bg-white/40 shadow-sm backdrop-blur-md">
            <table className="w-full min-w-[600px] border-collapse text-right">
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
                      className="border-olive-100/30 hover:bg-olive-50/50 border-t transition-colors"
                    >
                      <td className="p-16 font-bold text-gray-800">
                        {schedule.day_display}
                      </td>
                      <td className="p-16 text-gray-700">
                        {toHindiDigits(formatTime(schedule.start_time) || "")}
                      </td>
                      <td className="p-16 text-gray-700">
                        {toHindiDigits(formatTime(schedule.end_time) || "")}
                      </td>
                      <td className="p-16 text-gray-700">
                        {toHindiDigits(
                          schedule.grace_period_minutes.toString(),
                        )}{" "}
                        دقيقة
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-32 text-center text-gray-500 italic"
                    >
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
