import { StaffAttendanceListItem } from "@/types/entities/staff-attendance";
import { ReadonlyURLSearchParams } from "next/navigation";

export function filterAttendances(
  attendances: StaffAttendanceListItem[],
  params: ReadonlyURLSearchParams,
) {
  const searchQuery = params.get("search")?.toLowerCase() || "";
  const statusQuery = params.get("status")?.toLowerCase() || "";
  const attendanceTypeQuery =
    params.get("attendance_type")?.toLowerCase() || "";

  const filteredAttendances = attendances
    .filter((a) => {
      if (!searchQuery) return true;
      return (
        a.instructor_name.toLowerCase().includes(searchQuery) ||
        a.lecture_info?.course_title?.toLowerCase().includes(searchQuery) ||
        a.attendance_type_display.toLowerCase().includes(searchQuery)
      );
    })
    .filter((a) => {
      if (!statusQuery) return true;
      return a.status === statusQuery;
    })
    .filter((a) => {
      if (!attendanceTypeQuery) return true;
      return a.attendance_type === attendanceTypeQuery;
    });

  return filteredAttendances;
}
