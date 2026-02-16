"use client";

import { useParams } from "next/navigation";
import { CourseDetailsPage } from "@/components/course-details";
import {
  MOCK_ENROLLMENTS,
  MOCK_ATTENDANCE_RECORDS,
} from "@/dev-data/dashboard";

export default function StudentCourseDetailsPage() {
  const params = useParams();
  const rawId = params.enrollmentId;
  const enrollmentId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const enrollment = MOCK_ENROLLMENTS.find((e) => e.id === enrollmentId);

  return (
    <CourseDetailsPage
      enrollment={enrollment}
      attendanceRecords={MOCK_ATTENDANCE_RECORDS}
      backHref="/student"
    />
  );
}
