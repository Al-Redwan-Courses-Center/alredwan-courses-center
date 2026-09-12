import { getOnlineCourseById } from "@/actions/online-courses";
import { protect } from "@/actions/auth";
import { redirect } from "next/navigation";
import StudentOnlineCourseViewer from "@/components/dashboard/online-courses/StudentOnlineCourseViewer";
import { getMyEnrollments } from "@/actions/enrollments";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await protect(["student", "parent"]);
  
  const { courseId } = await params;

  // Verify enrollment status before rendering content
  const myEnrollments = await getMyEnrollments();
  const enrollment = myEnrollments.find(
    (e) => String(e.online_course) === String(courseId) && e.status === "active"
  );

  if (!enrollment) {
    redirect("/dashboard/my-courses");
  }

  // Parents watch on behalf of a child, so progress is tracked against them.
  const childId = enrollment.child_id;
  const course = await getOnlineCourseById(courseId, childId);

  if (!course) {
    redirect("/dashboard/my-courses");
  }

  return <StudentOnlineCourseViewer course={course} childId={childId} />;
}
