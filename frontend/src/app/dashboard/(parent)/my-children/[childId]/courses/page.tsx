import StudentMyCoursesPage from "@/components/dashboard/student/StudentMyCoursesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  return <StudentMyCoursesPage childId={childId} />;
}
