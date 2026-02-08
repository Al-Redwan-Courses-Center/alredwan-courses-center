import { getUser, protect } from "@/actions/auth";
import ParentOverviewPage from "@/components/dashboard/parent/ParentOverviewPage";
import StudentOverviewPage from "@/components/dashboard/student/StudentOverviewPage";

export default async function Page() {
  await protect(["student", "parent"]);

  const { role } = await getUser();

  if (role === "student") return <StudentOverviewPage />;
  if (role === "parent") return <ParentOverviewPage />;

  return <div>Hello Overview!</div>;
}
