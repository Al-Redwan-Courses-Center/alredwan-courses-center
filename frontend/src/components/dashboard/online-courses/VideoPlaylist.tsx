"use client";

import { FileText } from "lucide-react";
import CheckMarkIcon from "@/components/icons/CheckMarkIcon";
import MonitorPlayIcon from "@/components/icons/MonitorPlayIcon";
import { getFullImageUrl } from "@/lib/image-utils";
import { cn, formatDuration } from "@/lib/utils";
import { VideoLectureItem } from "@/types/entities";

interface VideoPlaylistProps {
  lectures: VideoLectureItem[];
  activeLecture: VideoLectureItem | null;
  onSelectLecture: (lecture: VideoLectureItem) => void;
}

export default function VideoPlaylist({
  lectures,
  activeLecture,
  onSelectLecture,
}: VideoPlaylistProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <div className="bg-olive-900 border-b border-gray-800 p-4">
        <h3 className="text-lg font-bold text-white">قائمة المحاضرات</h3>
        <p className="mt-1 text-sm text-gray-400">{lectures.length} محاضرة</p>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {lectures.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-400">
            لا توجد محاضرات في هذه الدورة
          </p>
        )}

        {lectures.map((lecture) => {
          const isActive = activeLecture?.id === lecture.id;
          const isCompleted = lecture.watch_progress?.is_completed;
          const progress = lecture.watch_progress?.completion_percentage || 0;

          return (
            <div key={lecture.id} className="border-b border-gray-800/50">
              <button
                onClick={() => onSelectLecture(lecture)}
                className={cn(
                  "flex w-full gap-3 p-4 text-start transition-colors hover:bg-gray-800",
                  isActive && "border-beige-500 bg-olive-900 border-e-2",
                )}
              >
                <div className="mt-1 shrink-0">
                  {isCompleted ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                      <CheckMarkIcon className="h-3 w-3" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center",
                        isActive ? "text-beige-500" : "text-gray-500",
                      )}
                    >
                      <MonitorPlayIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    className={cn(
                      "line-clamp-2 text-sm font-medium break-words",
                      isActive ? "text-white" : "text-gray-300",
                    )}
                  >
                    {lecture.order}. {lecture.title}
                  </h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      {formatDuration(lecture.duration_seconds, "clock")}
                    </span>
                    {progress > 0 && !isCompleted && (
                      <>
                        <span>•</span>
                        <span className="text-olive-300">
                          {Math.round(progress)}% مكتمل
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {isActive &&
                lecture.materials &&
                lecture.materials.length > 0 && (
                  <div className="bg-olive-900 space-y-2 border-t border-gray-800/50 p-3">
                    <p className="mb-2 px-2 text-xs font-semibold text-gray-400">
                      المواد المرفقة
                    </p>
                    {lecture.materials.map((mat) => (
                      <a
                        key={mat.id}
                        href={
                          mat.external_url || getFullImageUrl(mat.file) || "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">{mat.title}</span>
                      </a>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
