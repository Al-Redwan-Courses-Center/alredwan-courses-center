"use client";

import Link from "next/link";
import { useState } from "react";
import ArrowRight from "@/components/icons/ArrowRight";
import { OnlineCourseDetail, VideoLectureItem } from "@/types/entities";
import VideoPlayer, { VideoUnavailable } from "./VideoPlayer";
import VideoPlaylist from "./VideoPlaylist";

interface VideoStudioWorkspaceProps {
  course: OnlineCourseDetail;
}

export default function VideoStudioWorkspace({
  course,
}: VideoStudioWorkspaceProps) {
  const lectures = course.video_lectures ?? [];
  const [activeLecture, setActiveLecture] = useState<VideoLectureItem | null>(
    lectures[0] ?? null,
  );

  return (
    <div className="flex min-h-full flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-olive-900 flex items-center gap-4 border-b border-gray-800 p-4">
        <Link
          href="/dashboard/courses?type=online"
          className="rounded-full p-2 text-white transition-colors hover:bg-gray-800"
          aria-label="العودة إلى الدورات الإلكترونية"
        >
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <div>
          <h1 className="line-clamp-1 text-xl font-bold text-white">
            {course.name}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {course.instructor?.name || "بدون معلم"}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Video Area */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-black">
          {activeLecture ? (
            <div className="flex flex-1 flex-col justify-center p-4 lg:p-6">
              <div className="mx-auto w-full max-w-[1200px]">
                <VideoPlayer
                  lecture={activeLecture}
                  fallback={<VideoUnavailable />}
                />

                <div className="mt-6 text-white">
                  <h2 className="mb-2 text-2xl font-bold">
                    {activeLecture.title}
                  </h2>
                  {activeLecture.description && (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-gray-400">
                      {activeLecture.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              لا توجد محاضرات في هذه الدورة
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex max-h-[500px] w-full shrink-0 flex-col border-t border-gray-800 bg-gray-900 lg:max-h-none lg:w-[400px] lg:border-s lg:border-t-0">
          <VideoPlaylist
            lectures={lectures}
            activeLecture={activeLecture}
            onSelectLecture={setActiveLecture}
          />
        </div>
      </main>
    </div>
  );
}
