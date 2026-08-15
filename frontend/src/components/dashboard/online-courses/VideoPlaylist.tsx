"use client";

import { VideoLectureItem } from "@/types/entities";
import MonitorPlayIcon from "@/components/icons/MonitorPlayIcon";
import CheckMarkIcon from "@/components/icons/CheckMarkIcon";
import ExcelIcon from "@/components/icons/ExcelIcon"; // Using this as generic file icon for now
import { formatCurrency } from "@/lib/utils";
import { getFullImageUrl } from "@/lib/image-utils";

interface VideoPlaylistProps {
  lectures: VideoLectureItem[];
  activeLecture: VideoLectureItem;
  onSelectLecture: (lecture: VideoLectureItem) => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlaylist({ lectures, activeLecture, onSelectLecture }: VideoPlaylistProps) {
  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-[#111]">
        <h3 className="font-bold text-white text-lg">قائمة المحاضرات</h3>
        <p className="text-gray-400 text-sm mt-1">
          {lectures.length} محاضرة
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {lectures.map((lecture) => {
          const isActive = activeLecture.id === lecture.id;
          const isCompleted = lecture.watch_progress?.is_completed;
          const progress = lecture.watch_progress?.completion_percentage || 0;
          
          return (
            <div key={lecture.id} className="border-b border-gray-800/50">
              <button
                onClick={() => onSelectLecture(lecture)}
                className={`w-full text-right p-4 transition-colors flex gap-3 hover:bg-[#222] ${
                  isActive ? "bg-[#2a2a2a] border-r-2 border-brand-primary" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                      <CheckMarkIcon className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-brand-primary' : 'text-gray-500'}`}>
                      <MonitorPlayIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {lecture.order}. {lecture.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span>{formatDuration(lecture.duration_seconds)}</span>
                    {progress > 0 && !isCompleted && (
                      <>
                        <span>•</span>
                        <span className="text-brand-secondary">{Math.round(progress)}% مكتمل</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
              
              {isActive && lecture.materials && lecture.materials.length > 0 && (
                <div className="bg-[#111] p-3 space-y-2 border-t border-gray-800/50">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-2">المواد المرفقة</p>
                  {lecture.materials.map((mat) => (
                    <a
                      key={mat.id}
                      href={mat.external_url || getFullImageUrl(mat.file) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#222] hover:bg-[#333] transition-colors text-sm text-gray-300"
                    >
                      <ExcelIcon className="w-4 h-4 text-gray-400" />
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
