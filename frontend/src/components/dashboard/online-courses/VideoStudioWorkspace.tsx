"use client";

import { useState } from "react";
import { OnlineCourseDetail, VideoLectureItem } from "@/types/entities";
import VideoPlayer from "./VideoPlayer";
import VideoPlaylist from "./VideoPlaylist";
import Link from "next/link";
import ArrowRight from "@/components/icons/ArrowRight";

interface VideoStudioWorkspaceProps {
  course: OnlineCourseDetail;
}

export default function VideoStudioWorkspace({ course }: VideoStudioWorkspaceProps) {
  const [activeLecture, setActiveLecture] = useState<VideoLectureItem | null>(
    course.video_lectures?.[0] || null
  );

  const handleProgress = (progress: { playedSeconds: number; played: number }) => {
    // In a real implementation, debounced call to updateVideoWatchProgress server action
  };

  const handleEnded = () => {
    // Optionally auto-advance to next lecture
    if (!activeLecture) return;
    const currentIndex = course.video_lectures.findIndex(l => l.id === activeLecture.id);
    if (currentIndex >= 0 && currentIndex < course.video_lectures.length - 1) {
      setActiveLecture(course.video_lectures[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-black -m-6 flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-gray-800 bg-[#111]">
        <Link 
          href="/dashboard/courses" 
          className="p-2 rounded-full hover:bg-[#222] transition-colors text-white"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white line-clamp-1">{course.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{course.instructor?.name || "بدون معلم"}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black relative">
          {activeLecture ? (
            <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
              <div className="max-w-[1200px] w-full mx-auto">
                <VideoPlayer 
                  lecture={activeLecture} 
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                />
                
                <div className="mt-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">{activeLecture.title}</h2>
                  {activeLecture.description && (
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                      {activeLecture.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              لا توجد محاضرات في هذه الدورة
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[400px] flex-shrink-0 border-l border-gray-800 bg-[#0a0a0a] flex flex-col max-h-[500px] lg:max-h-none">
          <VideoPlaylist 
            lectures={course.video_lectures || []}
            activeLecture={activeLecture!}
            onSelectLecture={setActiveLecture}
          />
        </div>
      </main>
    </div>
  );
}
