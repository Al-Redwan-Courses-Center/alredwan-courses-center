"use client";

import { useParams, notFound } from "next/navigation";
import { CourseDetailsPage } from "@/components/course-details";
import {
  MOCK_ENROLLMENTS,
  MOCK_ATTENDANCE_RECORDS,
  MOCK_CHILDREN,
  MOCK_PARENT_USER,
} from "@/dev-data/dashboard";

export default function ChildCourseDetailsPage() {
  const params = useParams();
  const childId = params.childId as string;
  const enrollmentId = parseInt(params.enrollmentId as string);

  // Find the child by ID
  const child = MOCK_CHILDREN.find((c) => c.id === childId);

  // Validate child ownership
  if (!child || child.parent_id !== MOCK_PARENT_USER.id) {
    notFound();
  }

  // Find the enrollment by ID
  const enrollment = MOCK_ENROLLMENTS.find((e) => e.id === enrollmentId);

  return (
    <CourseDetailsPage
      enrollment={enrollment}
      attendanceRecords={MOCK_ATTENDANCE_RECORDS}
      backHref={`/parent/child/${childId}`}
      breadcrumbItems={[
        { label: "لوحة التحكم الرئيسية", href: "/parent" },
        {
          label: `${child.first_name} ${child.last_name}`,
          href: `/parent/child/${childId}`,
        },
        { label: "تفاصيل الدورة" },
      ]}
      childInfo={{
        firstName: child.first_name,
        lastName: child.last_name,
      }}
    />
  );
}
