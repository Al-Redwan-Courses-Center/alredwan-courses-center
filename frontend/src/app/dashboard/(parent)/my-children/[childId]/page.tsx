import StudentOverviewPage from "@/components/dashboard/student/StudentOverviewPage";
import { getMyChildById } from "@/dev-data/db";

export default async function Page({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  return <StudentOverviewPage childId={childId} />;
}
