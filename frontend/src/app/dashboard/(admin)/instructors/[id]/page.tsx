import { getInstructorDetail, getSupervisorSchedules, getInstructorAttendanceHistory } from "@/actions/admin-instructors";
import InstructorProfileView from "@/components/dashboard/admin/instructors/InstructorProfileView";
import InstructorTimetableView from "@/components/dashboard/admin/instructors/InstructorTimetableView";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Button from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // Parallel data fetching
  const [instructor, attendances, schedules] = await Promise.all([
    getInstructorDetail(id),
    getInstructorAttendanceHistory(id),
    getSupervisorSchedules(id),
  ]);

  if (!instructor) {
    notFound();
  }

  const isSupervisor = instructor.type === "supervisor";

  return (
    <div className="px-16 py-32 flex flex-col gap-32 max-[1000px]:px-6 max-[1000px]:py-10 max-[1000px]:gap-16">
      {/* Header with Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-16 max-[1000px]:gap-6">
        <div>
          <h1 className="text-4xl font-medad text-olive-800">تفاصيل المعلم</h1>
          <p className="text-olive-300">عرض وإدارة بيانات المعلم وجدول أعماله</p>
        </div>
        
        <div className="flex gap-12 max-[1000px]:w-full">
          <Link href={`/dashboard/admin/todays-staff-attendances?instructor=${id}`} className="max-[1000px]:w-full">
            <Button variant="outline" className="border-olive-200 text-olive-700 hover:bg-olive-50 max-[1000px]:w-full max-[1000px]:justify-center">
              سجل الحضور الكامل
            </Button>
          </Link>

        </div>
      </div>

      {/* Profile Section */}
      <InstructorProfileView instructor={instructor} />

      {/* Timetable Section */}
      <InstructorTimetableView 
        attendances={attendances} 
        supervisorSchedules={schedules} 
        isSupervisor={isSupervisor} 
      />
    </div>
  );
}
