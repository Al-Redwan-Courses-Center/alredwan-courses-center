import type { Metadata } from "next";
import { getUser } from "@/actions/auth";
import InstructorMyCoursesPage from "@/components/dashboard/instructor/InstructorMyCoursesPage";
import StudentMyCoursesPage from "@/components/dashboard/student/StudentMyCoursesPage";

export const metadata: Metadata = {
  title: "جميع الدورات",
};

export default async function Page() {
  const { role } = await getUser();

  if (role === "instructor") return <InstructorMyCoursesPage />;
  if (role === "student") return <StudentMyCoursesPage />;

  return null;
}
