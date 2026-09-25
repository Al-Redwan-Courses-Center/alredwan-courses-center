import LectureDetailPageView from "@/components/courses/LectureDetailPageView";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lectureId: string }>;
  searchParams?: Promise<{ child?: string }>;
}) {
  const { courseId, lectureId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const childId = resolvedSearchParams.child;

  return (
    <LectureDetailPageView
      courseId={courseId}
      lectureId={lectureId}
      childId={childId}
    />
  );
}
