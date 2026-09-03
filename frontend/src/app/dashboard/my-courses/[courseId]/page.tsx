import StudentCourseDetailPage from "@/components/courses/StudentCourseDetailPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ child?: string }>;
}) {
  const { courseId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const childId = resolvedSearchParams.child;

  return <StudentCourseDetailPage courseId={courseId} childId={childId} />;
}
