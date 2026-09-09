import LectureDetailPageView from "@/components/courses/LectureDetailPageView";

export default async function Page({
  params,
}: {
  params: Promise<{ childId: string; courseId: string; lectureId: string }>;
}) {
  const { childId, courseId, lectureId } = await params;

  return (
    <LectureDetailPageView
      courseId={courseId}
      lectureId={lectureId}
      childId={childId}
    />
  );
}
