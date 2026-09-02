import { redirect } from "next/navigation";

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

  redirect(
    `/dashboard/my-courses/${courseId}${childId ? `?child=${childId}` : ""}`,
  );
}
