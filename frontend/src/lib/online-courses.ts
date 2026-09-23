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
 * Ids of lectures that are sequentially locked: everything after the first
 * lecture that has not been completed. Mirrors the server rule so the UI can
 * react to optimistic completions before the refreshed course arrives.
 */
export function getLockedLectureIds(
  lectures: VideoLectureItem[] | undefined,
  completedIds: Set<string>,
): Set<string> {
  const locked = new Set<string>();
  let blocked = false;
  for (const lecture of lectures ?? []) {
    if (blocked) {
      locked.add(lecture.id);
    } else if (!completedIds.has(lecture.id)) {
      blocked = true;
    }
  }
  return locked;
}

/**
 * The lecture a learner should land on: the first one that is open and not
 * yet completed, falling back to the first lecture at all.
 */
export function getNextOpenLectureId(
  lectures: VideoLectureItem[] | undefined,
  completedIds: Set<string>,
  lockedIds: Set<string>,
): string | null {
  const list = lectures ?? [];
  const next = list.find(
    (lecture) => !lockedIds.has(lecture.id) && !completedIds.has(lecture.id),
  );
  return next?.id ?? list[0]?.id ?? null;
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
