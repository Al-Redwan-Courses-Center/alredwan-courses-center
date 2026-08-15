import { getOnlineCourseById } from "@/actions/online-courses";
import { protect } from "@/actions/auth";
import VideoStudioWorkspace from "@/components/dashboard/online-courses/VideoStudioWorkspace";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await protect(["admin", "instructor"]);
  
  const { courseId } = await params;
  const course = await getOnlineCourseById(courseId);

  if (!course) {
    redirect("/dashboard/online-courses");
  }

  return <VideoStudioWorkspace course={course} />;
}
