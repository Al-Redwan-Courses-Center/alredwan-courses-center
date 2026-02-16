"use client";

import { useRouter } from "next/navigation";
import StudentOrChildDashboard from "@/components/dashboard/StudentOrChildDashboard";
import {
  MOCK_STUDENT_USER,
  MOCK_DASHBOARD_SUMMARY,
  MOCK_ENROLLMENTS,
  MOCK_PENDING_ENROLLMENTS,
} from "@/dev-data/dashboard";

export default function StudentDashboardPage() {
  const router = useRouter();

  const handleViewCourseDetails = (enrollmentId: number) => {
    router.push(`/student/courses/${enrollmentId}`);
  };

  const handleCancelEnrollment = async (enrollmentId: number) => {
    // TODO: Implement API call to cancel enrollment
    console.log("Cancel enrollment:", enrollmentId);
    alert("سيتم إلغاء التسجيل قريباً");
  };

  const handleRefreshEnrollments = () => {
    // TODO: Implement refresh logic
    console.log("Refresh enrollments");
    window.location.reload();
  };

  return (
    <StudentOrChildDashboard
      mode="student"
      user={MOCK_STUDENT_USER}
      summary={MOCK_DASHBOARD_SUMMARY}
      enrollments={MOCK_ENROLLMENTS}
      pendingEnrollments={MOCK_PENDING_ENROLLMENTS}
      onViewCourseDetails={handleViewCourseDetails}
      onCancelEnrollment={handleCancelEnrollment}
      onRefreshEnrollments={handleRefreshEnrollments}
    />
  );
}
