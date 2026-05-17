import { getUser, protect } from "@/actions/auth";
import { getStudentCourses } from "@/actions/courses";
import {
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import ParentOverviewPage from "@/components/dashboard/parent/ParentOverviewPage";
import StudentOverviewPage from "@/components/dashboard/student/StudentOverviewPage";

export default async function Page() {
  await protect(["student", "parent"]);

  const user = await getUser();
  const { role, first_name } = user;

  if (role === "student") {
    const [activeCourses, requests, enrollments] = await Promise.all([
      getStudentCourses(),
      getMyEnrollmentRequests(),
      getMyEnrollments(),
    ]);

    const sortedRequests = requests.sort(
      (a, b) =>
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ] -
        ENROLLMENT_REQUEST_STATUS_WEIGHTS[
          b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
        ],
    );

    const activeCoursesCount = enrollments.filter((e) => e.status === "active").length;
    const pendingRequestsCount = requests.filter((e) => e.status === "pending").length;
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
        name={first_name}
        activeCourses={activeCourses}
        enrollmentRequests={sortedRequests}
        activeCoursesCount={activeCoursesCount}
        pendingRequestsCount={pendingRequestsCount}
        attendanceRate={attendanceRate}
      />
    );
  }

  if (role === "parent") return <ParentOverviewPage />;

  return <div>Hello Overview!</div>;
}
