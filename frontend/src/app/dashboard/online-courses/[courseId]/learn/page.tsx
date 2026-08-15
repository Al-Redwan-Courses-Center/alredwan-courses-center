import { getOnlineCourseById } from "@/actions/online-courses";
import { protect } from "@/actions/auth";
import { redirect } from "next/navigation";
import StudentOnlineCourseViewer from "@/components/dashboard/online-courses/StudentOnlineCourseViewer";

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

  return <StudentOnlineCourseViewer course={course} />;
}
