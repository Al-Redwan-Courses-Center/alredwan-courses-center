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
  const course = await getOnlineCourseById(courseId);

  if (!course) {
    redirect("/dashboard/my-courses");
  }
  
  // Verify enrollment status before rendering content
  const myEnrollments = await getMyEnrollments();
  const isEnrolled = myEnrollments.some(
    (e) => String(e.online_course) === String(courseId) && e.status === "active"
  );

  if (!isEnrolled) {
    redirect("/dashboard/my-courses");
  }

  return <StudentOnlineCourseViewer course={course} />;
}
