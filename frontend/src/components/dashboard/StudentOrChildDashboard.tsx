"use client";
import {
  StudentUser,
  Child,
  ParentUser,
  Enrollment,
  EnrollmentRequest,
  DashboardSummary,
} from "@/types/dashboard";
import { WelcomeHeader } from "@/components/dashboard/Shared";
import Summary from "@/components/dashboard/Summary";
import CourseList from "@/components/dashboard/CoursesList";
import PendingEnrollmentsList from "./PendingEnrollmentsList";
import CoursesActiveIcon from "@/components/icons/CoursesActiveIcon";
import PendingRequestsIcon from "@/components/icons/PendingRequestsIcon";
import AttendanceCheckIcon from "@/components/icons/AttendanceCheckIcon";

interface StudentOrChildDashboardProps {
  mode: "student" | "child";
  // For student mode
  user?: StudentUser;
  // For child mode
  child?: Child;
  parentUser?: ParentUser;
  // Common props
  summary: DashboardSummary;
  enrollments: Enrollment[];
  pendingEnrollments: EnrollmentRequest[];
  onViewCourseDetails: (enrollmentId: number) => void;
  onCancelEnrollment?: (enrollmentId: number) => void;
  onRefreshEnrollments?: () => void;
}

export default function StudentOrChildDashboard({
  mode,
  user,
  child,
  parentUser,
  summary,
  enrollments,
  pendingEnrollments,
  onViewCourseDetails,
  onCancelEnrollment,
  onRefreshEnrollments,
}: StudentOrChildDashboardProps) {
  return (
    <div className="relative z-50 flex h-full max-h-full flex-col overflow-y-auto pt-15 sm:pt-8 md:pt-12">
      {/* Welcome Header */}
      <WelcomeHeader user={user} child={child} parentUser={parentUser} />

      {/* Summary Statistics */}
      <Summary
        items={[
          {
            id: "active",
            label: "الكورسات النشطة",
            value: summary.active_courses_count,
            icon: <CoursesActiveIcon className="h-12 w-12" />,
          },
          {
            id: "pending",
            label: "الطلبات المعلقة",
            value: summary.upcoming_lectures_count,
            icon: <PendingRequestsIcon className="h-12 w-12" />,
          },
          {
            id: "attendance",
            label: "اجمالي الحضور",
            value: summary.attendance_rate.toFixed(0),
            suffix: "%",
            icon: <AttendanceCheckIcon className="h-12 w-12" />,
          },
        ]}
      />

      {/* My Courses */}
      <CourseList
        enrollments={enrollments}
        onViewCourseDetails={onViewCourseDetails}
        mode={mode}
      />
      {/* Pending Enrollments */}
      <PendingEnrollmentsList
        pendingEnrollments={pendingEnrollments}
        onCancel={onCancelEnrollment}
        onRefresh={onRefreshEnrollments}
      />
    </div>
  );
}
