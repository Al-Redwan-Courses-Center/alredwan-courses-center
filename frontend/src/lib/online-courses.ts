import type { VideoLectureItem } from "@/types/entities";

/** Ids of the lectures the viewer has fully watched. */
export function getCompletedLectureIds(
  lectures: VideoLectureItem[] | undefined,
): Set<string> {
  return new Set(
    (lectures ?? [])
      .filter((lecture) => lecture.watch_progress?.is_completed)
      .map((lecture) => lecture.id),
  );
}

/**
 * Progress of an online course as a whole percentage, derived from how many
 * lectures were watched to completion.
 */
export function getOnlineCourseProgress(
  lectures: VideoLectureItem[] | undefined,
  completedCount = getCompletedLectureIds(lectures).size,
): number {
  const total = lectures?.length ?? 0;
  if (total === 0) return 0;

  return Math.round((completedCount / total) * 100);
}
