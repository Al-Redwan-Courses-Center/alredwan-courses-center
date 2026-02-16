import { LectureAttendance } from "@/types/dashboard";
import { cn, toHindiDigits } from "@/lib/utils";
import Summary from "@/components/dashboard/Summary";

interface AttendanceTableProps {
  attendanceRecords: LectureAttendance[];
}

const PresentIcon = (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
    <path
      d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
      fill="currentColor"
    />
  </svg>
);

const AbsentIcon = (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      fill="currentColor"
    />
  </svg>
);

const NotMarkedIcon = (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
    <circle cx="12" cy="12" r="8" fill="currentColor" />
  </svg>
);

export default function AttendanceTable({
  attendanceRecords,
}: AttendanceTableProps) {
  if (attendanceRecords.length === 0) {
    return (
      <div className="tablet:mb-12 mobile:mb-8 mb-16">
        <h2 className="text-olive-700 tablet:mb-6 tablet:text-3xl mobile:mb-4 mobile:text-2xl mb-8 text-4xl font-bold">
          سجل الحضور
        </h2>

        <div className="tablet:py-16 mobile:py-12 flex flex-col items-center justify-center rounded-xl bg-gray-50 py-20">
          <p className="tablet:text-xl mobile:text-lg text-center text-2xl text-gray-600">
            لا توجد محاضرات مسجلة بعد
          </p>
        </div>
      </div>
    );
  }

  const presentCount = attendanceRecords.filter(
    (r) => r.is_present === true,
  ).length;
  const absentCount = attendanceRecords.filter(
    (r) => r.is_present === false,
  ).length;
  const notMarkedCount = attendanceRecords.filter(
    (r) => r.is_present === null,
  ).length;

  const summaryItems = [
    {
      id: "present",
      label: "إجمالي الحضور",
      value: toHindiDigits(presentCount),
      icon: <span className="text-olive-700">{PresentIcon}</span>,
    },
    {
      id: "absent",
      label: "إجمالي الغياب",
      value: toHindiDigits(absentCount),
      icon: <span className="text-red-600">{AbsentIcon}</span>,
    },
    {
      id: "not-marked",
      label: "لم يُسجل بعد",
      value: toHindiDigits(notMarkedCount),
      icon: <span className="text-gray-600">{NotMarkedIcon}</span>,
    },
  ];

  return (
    <div className="tablet:mb-12 mobile:mb-8 mb-16">
      <h2 className="text-olive-700 tablet:mb-6 tablet:text-3xl mobile:mb-4 mobile:text-2xl mb-8 w-full text-4xl font-bold">
        سجل الحضور
      </h2>

      {/* Table Container with Horizontal Scroll */}
      <div className="shadow-primary w-full overflow-x-auto rounded-xl bg-white">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="bg-olive-500 text-white">
              <th className="border-olive-600 tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base border-l p-5 text-right text-2xl font-bold">
                رقم المحاضرة
              </th>
              <th className="border-olive-600 tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base border-l p-5 text-right text-2xl font-bold">
                عنوان المحاضرة
              </th>
              <th className="border-olive-600 tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base border-l p-5 text-right text-2xl font-bold">
                التاريخ
              </th>
              <th className="border-olive-600 tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base border-l p-5 text-right text-2xl font-bold">
                الوقت
              </th>
              <th className="border-olive-600 tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base border-l p-5 text-center text-2xl font-bold">
                الحضور
              </th>
              <th className="border-olive-600 tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base border-l p-5 text-center text-2xl font-bold">
                التقييم
              </th>
              <th className="tablet:p-4 tablet:text-xl mobile:p-3 mobile:text-base p-5 text-right text-2xl font-bold">
                ملاحظات
              </th>
            </tr>
          </thead>

          <tbody>
            {attendanceRecords.map((record, index) => {
              const isEvenRow = index % 2 === 0;
              const isPresentMarked = record.is_present === true;
              const isAbsentMarked = record.is_present === false;
              const isNotMarkedYet = record.is_present === null;

              return (
                <tr
                  key={record.id}
                  className={cn(
                    "hover:bg-olive-50 transition-colors",
                    isEvenRow ? "bg-gray-50" : "bg-white",
                  )}
                >
                  <td className="tablet:p-4 tablet:text-lg mobile:p-3 mobile:text-base border-l border-gray-300 p-5 text-right text-xl">
                    {toHindiDigits(record.lecture_number)}
                  </td>

                  <td className="tablet:p-4 tablet:text-lg mobile:p-3 mobile:text-base border-l border-gray-300 p-5 text-right text-xl font-semibold">
                    {record.lecture_title}
                  </td>

                  <td className="tablet:p-4 tablet:text-lg mobile:p-3 mobile:text-base border-l border-gray-300 p-5 text-right text-xl">
                    {toHindiDigits(record.scheduled_date).replaceAll("-", "/")}
                  </td>

                  <td className="tablet:p-4 tablet:text-lg mobile:p-3 mobile:text-base border-l border-gray-300 p-5 text-right text-xl">
                    {toHindiDigits(record.scheduled_start_time.slice(0, 5))} -{" "}
                    {toHindiDigits(record.scheduled_end_time.slice(0, 5))}
                  </td>

                  <td className="tablet:p-4 mobile:p-3 border-l border-gray-300 p-5 text-center">
                    {isPresentMarked && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="tablet:text-lg mobile:text-base text-xl font-bold text-green-600">
                          حاضر
                        </span>
                      </div>
                    )}

                    {isAbsentMarked && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-red-600">✕</span>
                        <span className="tablet:text-lg mobile:text-base text-xl font-bold text-red-600">
                          غائب
                        </span>
                      </div>
                    )}

                    {isNotMarkedYet && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-500">●</span>
                        <span className="tablet:text-lg mobile:text-base text-xl text-gray-500">
                          لم يُسجل بعد
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="tablet:p-4 tablet:text-lg mobile:p-3 mobile:text-base border-l border-gray-300 p-5 text-center text-xl">
                    {record.performance_rating !== null &&
                    record.performance_rating !== undefined ? (
                      <span
                        className={cn(
                          "font-bold",
                          record.performance_rating >= 8
                            ? "text-green-600"
                            : record.performance_rating >= 5
                              ? "text-amber-600"
                              : "text-red-600",
                        )}
                      >
                        {toHindiDigits(record.performance_rating)} / ١٠
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="tablet:p-4 tablet:text-lg mobile:p-3 mobile:text-base p-5 text-right text-xl">
                    {record.instructor_notes || (
                      <span className="text-gray-400">لا توجد ملاحظات</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ Summary الجديد */}
      <div className="tablet:mt-6 mobile:mt-5 mt-8 w-full">
        <Summary items={summaryItems} />
      </div>
    </div>
  );
}
