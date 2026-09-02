import type { Metadata } from "next";
import { getUser } from "@/actions/auth";
import InstructorMyCoursesPage from "@/components/dashboard/instructor/InstructorMyCoursesPage";
import StudentMyCoursesPage from "@/components/dashboard/student/StudentMyCoursesPage";

export const metadata: Metadata = {
  title: "جميع الدورات",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ child?: string }>;
}) {
  const { role } = await getUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const childId = resolvedSearchParams.child;

  if (role === "instructor") return <InstructorMyCoursesPage />;
  if (role === "student" || role === "parent")
    return <StudentMyCoursesPage childId={childId} />;

  return null;
}
