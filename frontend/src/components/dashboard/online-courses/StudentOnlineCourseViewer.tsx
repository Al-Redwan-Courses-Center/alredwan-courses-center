"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lock,
  Menu,
  PlayCircle,
  Radio,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { updateVideoWatchProgress } from "@/actions/online-courses";
import Button from "@/components/ui/Button";
import { getFullImageUrl } from "@/lib/image-utils";
import {
  getCompletedLectureIds,
  getLockedLectureIds,
  getNextOpenLectureId,
  getOnlineCourseProgress,
} from "@/lib/online-courses";
import { cn, formatDate, formatTime, toHindiDigits } from "@/lib/utils";
import { OnlineCourseDetail, VideoLectureItem } from "@/types/entities";
import VideoPlayer, { getEmbedUrl } from "./VideoPlayer";

// Matches the `min-[1000px]` breakpoint used by the dashboard layout.
const DESKTOP_MEDIA_QUERY = "(min-width: 1000px)";

const LOCKED_HINT = "أكمل المحاضرة السابقة أولاً لفتح هذه المحاضرة";

export default function StudentOnlineCourseViewer({
  course,
  childId = null,
}: {
  course: OnlineCourseDetail;
  childId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lectureIdParam = searchParams.get("lecture");
  const lectures = course.video_lectures;

  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState(() =>
    getCompletedLectureIds(lectures),
  );

  // Resync the optimistic set whenever the server sends a fresh course
  // (e.g. after `revalidatePath`), without an extra effect render.
  const [syncedCourse, setSyncedCourse] = useState(course);
  if (syncedCourse !== course) {
    setSyncedCourse(course);
    setOptimisticCompletedIds(getCompletedLectureIds(lectures));
  }

  // A lecture is locked when the server says so (its content is withheld) or
  // when the client-side rule says so; the two only differ for the moment
  // between an optimistic completion and the refreshed course arriving.
  const clientLockedIds = getLockedLectureIds(lectures, optimisticCompletedIds);
  const isLocked = (lecture: VideoLectureItem) =>
    lecture.is_locked || clientLockedIds.has(lecture.id);

  const [activeLectureId, setActiveLectureId] = useState<string | null>(() => {
    const requested = lectures.find((lecture) => lecture.id === lectureIdParam);
    if (requested && !isLocked(requested)) return requested.id;
    return getNextOpenLectureId(
      lectures,
      optimisticCompletedIds,
      clientLockedIds,
    );
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Closed during SSR and hydration (no layout info yet), then opened on
  // desktop once mounted so the markup matches on both sides.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
      setIsSidebarOpen(true);
    }
  }, []);

  const progressPercentage = getOnlineCourseProgress(
    lectures,
    optimisticCompletedIds.size,
  );

  const activeIndex = lectures.findIndex(
    (lecture) => lecture.id === activeLectureId,
  );
  const activeLecture = activeIndex >= 0 ? lectures[activeIndex] : undefined;
  const nextLecture = activeIndex >= 0 ? lectures[activeIndex + 1] : undefined;
  const isActiveCompleted = activeLecture
    ? optimisticCompletedIds.has(activeLecture.id)
    : false;
  const isActiveLocked = activeLecture ? isLocked(activeLecture) : false;

  const selectLecture = (lecture: VideoLectureItem) => {
    if (isLocked(lecture)) return;
    setActiveLectureId(lecture.id);

    // Keep the lecture in the URL for refresh/back-forward without
    // re-running the server page; Next syncs `useSearchParams` with this.
    const params = new URLSearchParams(window.location.search);
    params.set("lecture", lecture.id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );

    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
      setIsSidebarOpen(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!activeLecture || isActiveLocked) return;

    const previousCompletedIds = new Set(optimisticCompletedIds);
    const lectureSeconds = activeLecture.duration_seconds || 1;

    setOptimisticCompletedIds((prev) => new Set([...prev, activeLecture.id]));
    setIsSubmitting(true);

    try {
      const result = await updateVideoWatchProgress(
        course.id,
        activeLecture.id,
        {
          watched_seconds: lectureSeconds,
          total_seconds: lectureSeconds,
          last_position_seconds: lectureSeconds,
        },
        childId,
      );

      if (result) {
        // The next lecture's content is only sent once the server sees the
        // completion, so pull the fresh course in.
        router.refresh();
      } else {
        // The action swallows API errors and returns null, so roll back on that too.
        setOptimisticCompletedIds(previousCompletedIds);
      }
    } catch (err) {
      console.error("Failed to mark lecture as completed:", err);
      setOptimisticCompletedIds(previousCompletedIds);
    } finally {
      setIsSubmitting(false);
    }
  };

  const imageMaterials =
    activeLecture?.materials?.filter((m) => m.file_type === "image") ?? [];
  const fileMaterials =
    activeLecture?.materials?.filter((m) => m.file_type !== "image") ?? [];
  const hasEmbeddableVideo = activeLecture
    ? getEmbedUrl(activeLecture) !== null
    : false;

  return (
    <div className="relative flex h-[calc(100dvh-6rem)] w-full overflow-hidden bg-white">
      {/* Sidebar with Lecture List */}
      <aside
        className={cn(
          "z-30 flex shrink-0 flex-col border-e border-gray-200 bg-white transition-all duration-300",
          "absolute start-0 top-0 bottom-0 min-[1000px]:relative min-[1000px]:z-0",
          isSidebarOpen
            ? "w-80 shadow-2xl min-[1000px]:shadow-none md:w-96"
            : "pointer-events-none invisible h-0 w-0 border-none min-[1000px]:h-full",
        )}
        aria-hidden={!isSidebarOpen}
      >
        <div className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <Button
              href="/dashboard/my-courses"
              variant="secondary"
              size="small"
            >
              <ChevronRight className="me-1 h-4 w-4" />
              العودة
            </Button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="إغلاق قائمة المحاضرات"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h1 className="text-olive-700 truncate text-2xl font-bold">
            {course.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <span>{toHindiDigits(lectures.length)} محاضرة</span>
            <span>•</span>
            <span>
              {toHindiDigits(Math.round(course.total_duration_seconds / 60))}{" "}
              دقيقة
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm font-bold text-gray-800">
            <span>{toHindiDigits(progressPercentage)}% تقدم</span>
            <div className="h-2 flex-1 shrink-0 overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-olive-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2 overflow-y-auto p-4">
          {lectures.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              لا يوجد محتوى متاح حالياً
            </p>
          ) : (
            lectures.map((lecture, index) => {
              const isActive = activeLectureId === lecture.id;
              const isCompleted = optimisticCompletedIds.has(lecture.id);
              const locked = isLocked(lecture);

              return (
                <button
                  key={lecture.id}
                  onClick={() => selectLecture(lecture)}
                  disabled={locked}
                  aria-disabled={locked}
                  title={locked ? LOCKED_HINT : undefined}
                  className={cn(
                    "flex w-full items-start rounded-xl border p-4 text-start transition-all",
                    isActive
                      ? "border-olive-200 bg-olive-50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
                    locked &&
                      "cursor-not-allowed bg-gray-50 opacity-60 hover:border-gray-100 hover:bg-gray-50",
                  )}
                >
                  <div className="me-3 mt-1 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : locked ? (
                      <Lock className="h-6 w-6 text-gray-400" />
                    ) : (
                      <PlayCircle
                        className={cn(
                          "h-6 w-6",
                          isActive ? "text-olive-600" : "text-gray-400",
                        )}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={cn(
                        "mb-1 truncate text-2xl font-bold",
                        isActive ? "text-olive-800" : "text-gray-800",
                      )}
                    >
                      {toHindiDigits(index + 1)}. {lecture.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {lecture.is_live_stream && (
                        <span className="flex items-center gap-1 text-red-500">
                          <Radio className="h-3 w-3" />
                          بث مباشر
                        </span>
                      )}
                      {locked ? (
                        <span>مقفلة</span>
                      ) : (
                        lecture.materials.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {toHindiDigits(lecture.materials.length)} مرفقات
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative flex h-full w-full flex-1 flex-col overflow-y-auto bg-gray-50">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute start-6 top-6 z-20 rounded-full border border-gray-200 bg-white p-3 text-gray-700 shadow-md transition-colors hover:bg-gray-50"
            title="إظهار القائمة"
            aria-label="فتح قائمة المحاضرات"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {!activeLecture ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xl font-bold text-gray-500">
              يرجى اختيار محاضرة لعرضها
            </p>
          </div>
        ) : isActiveLocked ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="shadow-soft flex max-w-xl flex-col items-center gap-4 rounded-[2.5rem] border border-gray-100 bg-white p-10 text-center">
              <Lock className="h-12 w-12 text-gray-400" />
              <h2 className="text-3xl font-bold text-gray-900">
                {activeLecture.title}
              </h2>
              <p className="text-xl text-gray-500">{LOCKED_HINT}</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 pt-20 md:p-10 md:pt-10">
            {/* Top Action Bar */}
            <div className="flex w-full flex-wrap justify-end gap-4">
              {isActiveCompleted && nextLecture && !isLocked(nextLecture) && (
                <Button
                  onClick={() => selectLecture(nextLecture)}
                  variant="secondary"
                  className="shadow-soft px-8"
                >
                  المحاضرة التالية
                  <ArrowLeft className="ms-2 inline h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={handleMarkAsCompleted}
                disabled={isSubmitting || isActiveCompleted}
                variant={isActiveCompleted ? "secondary" : "primary"}
                className="shadow-soft px-8"
              >
                {isSubmitting
                  ? "جاري الحفظ..."
                  : isActiveCompleted
                    ? "تم إتمام المحاضرة"
                    : "تحديد المحاضرة كمكتملة"}
              </Button>
            </div>

            {/* Live stream */}
            {activeLecture.is_live_stream && (
              <LiveStreamCard lecture={activeLecture} />
            )}

            {/* Video (hidden when the lecture has no embeddable video) */}
            {hasEmbeddableVideo && <VideoPlayer lecture={activeLecture} />}

            {/* Image Materials */}
            {imageMaterials.map((img) => {
              const src = getFullImageUrl(img.file);
              if (!src) return null;

              return (
                <div
                  key={img.id}
                  className="shadow-soft flex w-full justify-center rounded-[2.5rem] border border-gray-100 bg-white p-4"
                >
                  {/* Material hosts vary, so skip the optimizer and let the
                      image size itself within the container. */}
                  <Image
                    src={src}
                    alt={img.title}
                    width={1600}
                    height={900}
                    unoptimized
                    className="h-auto max-h-[70vh] w-auto max-w-full rounded-[2rem] object-contain"
                  />
                </div>
              );
            })}

            {/* Title & written content */}
            <div className="shadow-soft flex min-w-0 flex-col gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-10">
              <h2 className="text-3xl font-bold break-words text-gray-900">
                {activeLecture.title}
              </h2>
              {activeLecture.description && (
                <p className="text-2xl leading-relaxed font-medium break-words whitespace-pre-wrap text-gray-600">
                  {activeLecture.description}
                </p>
              )}
            </div>

            {/* Files */}
            {fileMaterials.length > 0 && (
              <div className="shadow-soft flex flex-col gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-10">
                <h3 className="text-olive-700 flex items-center gap-3 text-2xl font-bold">
                  <FileText className="h-6 w-6" />
                  المرفقات والملفات
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {fileMaterials.map((material) => (
                    <a
                      key={material.id}
                      href={
                        material.external_url ||
                        getFullImageUrl(material.file) ||
                        "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group hover:border-olive-300 hover:bg-olive-50 flex items-center rounded-xl border border-gray-200 p-4 transition-colors"
                    >
                      <div className="bg-olive-100 group-hover:bg-olive-200 me-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors">
                        <FileText className="text-olive-600 h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-gray-800">
                          {material.title}
                        </p>
                        <p className="text-sm text-gray-500 uppercase">
                          {material.file_type}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveStreamCard({ lecture }: { lecture: VideoLectureItem }) {
  const streamTime = lecture.live_stream_time
    ? new Date(lecture.live_stream_time)
    : null;
  const hasValidTime =
    streamTime !== null && !Number.isNaN(streamTime.getTime());

  return (
    <div className="shadow-soft flex flex-col gap-5 rounded-[2.5rem] border border-red-100 bg-red-50/60 p-8">
      <div className="flex items-center gap-3">
        <Radio className="h-7 w-7 animate-pulse text-red-500" />
        <h3 className="text-2xl font-bold text-gray-900">بث مباشر</h3>
      </div>

      {hasValidTime && (
        <p className="text-xl text-gray-700">
          الموعد: {formatDate(streamTime)} - {formatTime(streamTime)}
        </p>
      )}

      {lecture.video_url ? (
        <Button
          href={lecture.video_url}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          className="w-fit"
        >
          انضم للبث المباشر
        </Button>
      ) : (
        <p className="text-lg text-gray-500">سيتم إضافة رابط البث قبل الموعد</p>
      )}
    </div>
  );
}
