"use client";

import { useRouter, useParams } from "next/navigation";
import StudentOrChildDashboard from "@/components/dashboard/StudentOrChildDashboard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  MOCK_PARENT_USER,
  MOCK_CHILDREN,
  MOCK_DASHBOARD_SUMMARY,
  MOCK_ENROLLMENTS,
  MOCK_PENDING_ENROLLMENTS,
} from "@/dev-data/dashboard";
import { notFound } from "next/navigation";

export default function ChildDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;

  // Find the child by ID
  const child = MOCK_CHILDREN.find((c) => c.id === childId);

  // Validate child ownership (parent can only access their children)
  if (!child || child.parent_id !== MOCK_PARENT_USER.id) {
    notFound();
  }

  const handleViewCourseDetails = (enrollmentId: number) => {
    router.push(`/parent/child/${childId}/courses/${enrollmentId}`);
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
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "لوحة التحكم الرئيسية", href: "/parent" },
          { label: `${child.first_name} ${child.last_name}` },
        ]}
      />

      <StudentOrChildDashboard
        mode="child"
        child={child}
        parentUser={MOCK_PARENT_USER}
        summary={MOCK_DASHBOARD_SUMMARY}
        enrollments={MOCK_ENROLLMENTS}
        pendingEnrollments={MOCK_PENDING_ENROLLMENTS}
        onViewCourseDetails={handleViewCourseDetails}
        onCancelEnrollment={handleCancelEnrollment}
        onRefreshEnrollments={handleRefreshEnrollments}
      />
    </>
  );
}
