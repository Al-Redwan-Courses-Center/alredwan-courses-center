import { notFound } from "next/navigation";
import { getUser, protect } from "@/actions/auth";
import {
  getChildById,
  getChildCourses,
  getChildEnrollmentRequests,
  getChildEnrollments,
} from "@/actions/user";
import StudentOverviewPage from "@/components/dashboard/student/StudentOverviewPage";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";

export default async function Page({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  await protect(["parent"]);
  const { childId } = await params;

  const [parentUser, child] = await Promise.all([
    getUser(),
    getChildById(childId),
  ]);
  if (!child) {
    return notFound();
  }

  const [activeCourses, enrollmentRequests, enrollments] = await Promise.all([
    getChildCourses(childId),
    getChildEnrollmentRequests(childId),
    getChildEnrollments(childId),
  ]);

  const sortedRequests = enrollmentRequests.sort(
    (a, b) =>
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ] -
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ],
  );

  const activeCoursesCount = enrollments.filter(
    (e) => e.status === "active",
  ).length;
  const pendingRequestsCount = enrollmentRequests.filter(
    (e) => e.status === "pending",
  ).length;
  const attendanceRate = enrollments.length
    ? Math.round(
        enrollments.reduce(
          (acc, enrollment) => acc + (enrollment.completion_percentage || 0),
          0,
        ) / enrollments.length,
      )
    : 0;

  return (
    <StudentOverviewPage
      name={child.first_name}
      parentName={parentUser.first_name}
      activeCourses={activeCourses}
      enrollmentRequests={sortedRequests}
      activeCoursesCount={activeCoursesCount}
      pendingRequestsCount={pendingRequestsCount}
      attendanceRate={attendanceRate}
      role={"parent"}
    />
  );
}
