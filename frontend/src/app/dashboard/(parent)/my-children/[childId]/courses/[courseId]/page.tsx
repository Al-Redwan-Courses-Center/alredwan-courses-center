import StudentCourseDetailPage from "@/components/courses/StudentCourseDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ childId: string; courseId: string }>;
}) {
  const { childId, courseId } = await params;
  return <StudentCourseDetailPage courseId={courseId} childId={childId} />;
}
