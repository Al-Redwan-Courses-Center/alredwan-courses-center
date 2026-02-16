"use client";

import { notFound } from "next/navigation";
import { BackButton, CourseOverviewCard } from "@/components/course-details";
import AttendanceTable from "@/components/dashboard/AttendanceTable";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import ChildInfoBanner from "@/components/ui/ChildInfoBanner";
import { Enrollment, LectureAttendance } from "@/types/dashboard";

interface CourseDetailsPageProps {
  enrollment: Enrollment | undefined;
  attendanceRecords: LectureAttendance[];
  backHref: string;
  breadcrumbItems?: BreadcrumbItem[];
  childInfo?: {
    firstName: string;
    lastName: string;
  };
}

export default function CourseDetailsPage({
  enrollment,
  attendanceRecords,
  backHref,
  breadcrumbItems,
  childInfo,
}: CourseDetailsPageProps) {
  if (!enrollment) {
    notFound();
  }

  const {
    course,
    status,
    payment_status,
    progress_percentage,
    attendance_rate,
  } = enrollment;

  return (
    <div className="relative z-50 flex h-full max-h-full flex-col overflow-y-auto">
      {/* Breadcrumb (if provided) */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} />
      )}

      <div className="px-16 pt-15 sm:px-4 sm:pt-8 md:px-8 md:pt-12">
        {/* Back Button */}
        <BackButton href={backHref} />

        {/* Child Info Banner (for parent viewing child's course) */}
        {childInfo && (
          <ChildInfoBanner
            childFirstName={childInfo.firstName}
            childLastName={childInfo.lastName}
          />
        )}

        {/* Course Overview Card */}
        <CourseOverviewCard
          courseName={course.name}
          courseDescription={course.description}
          courseImage={course.image}
          coursePrice={course.price}
          status={status}
          paymentStatus={payment_status}
          instructor={
            course.instructor || {
              user: { first_name: "غير محدد", last_name: "" },
            }
          }
          numLectures={course.num_lectures || 0}
          startDate={course.start_date}
          endDate={course.end_date || ""}
          totalPrice={enrollment.total_price}
          amountPaid={enrollment.amount_paid}
          progressPercentage={progress_percentage}
          attendanceRate={attendance_rate}
        />

        {/* Attendance History Table */}
        <AttendanceTable attendanceRecords={attendanceRecords} />
      </div>
    </div>
  );
}
