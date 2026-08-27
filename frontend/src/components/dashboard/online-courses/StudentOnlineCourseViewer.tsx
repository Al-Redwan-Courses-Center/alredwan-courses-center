"use client";

import { useState } from "react";
import { OnlineCourseDetail } from "@/types/entities";
import { PlayCircle, FileText, CheckCircle2, ChevronRight, Menu, X } from "lucide-react";
import { cn, toHindiDigits } from "@/lib/utils";
import { getFullImageUrl } from "@/lib/image-utils";
import Button from "@/components/ui/Button";
import { updateVideoWatchProgress } from "@/actions/online-courses";
import { useRouter, useSearchParams } from "next/navigation";

export default function StudentOnlineCourseViewer({
  course,
  childId = null,
}: {
  course: OnlineCourseDetail;
  childId?: string | null;
}) {
  const searchParams = useSearchParams();
  const lectureIdParam = searchParams.get("lecture");
  const [activeLectureId, setActiveLectureId] = useState<string | null>(
    lectureIdParam || (course.video_lectures.length > 0 ? course.video_lectures[0].id : null)
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState<Set<string>>(
    new Set(course.video_lectures.filter((l) => l.watch_progress?.is_completed).map((l) => l.id))
  );

  const completedLecturesCount = optimisticCompletedIds.size;
  const progressPercentage = course.video_lectures.length > 0 
    ? Math.round((completedLecturesCount / course.video_lectures.length) * 100) 
    : 0;

  const activeLecture = course.video_lectures.find((l) => l.id === activeLectureId);

  const handleMarkAsCompleted = async () => {
    if (!activeLecture) return;
    setIsSubmitting(true);
    
    // Optimistic UI update
    setOptimisticCompletedIds(prev => new Set([...prev, activeLecture.id]));

    try {
      await updateVideoWatchProgress(
        course.id,
        activeLecture.id,
        {
          watched_seconds: activeLecture.duration_seconds || 1,
          total_seconds: activeLecture.duration_seconds || 1,
          last_position_seconds: activeLecture.duration_seconds || 1,
        },
        childId,
      );
      router.refresh();
    } catch (error) {
      console.error("Failed to mark as completed:", error);
      // Revert on error
      setOptimisticCompletedIds(prev => {
        const next = new Set(prev);
        next.delete(activeLecture.id);
        return next;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col min-[1000px]:flex-row overflow-hidden bg-gray-50 relative">
      
      {/* Sidebar: Lectures List */}
      <div 
        className={cn(
          "flex flex-col bg-white border-l border-gray-200 overflow-y-auto transition-[width] duration-300 shrink-0",
          isSidebarOpen 
            ? "w-full min-[1000px]:w-80 lg:w-96 min-[1000px]:h-full border-l" 
            : "w-0 h-0 min-[1000px]:h-full border-none pointer-events-none invisible"
        )}
        aria-hidden={!isSidebarOpen}
      >
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 w-full">
          <div className="flex items-center justify-between mb-4">
            <Button href="/dashboard/my-courses" variant="secondary" size="small">
              <ChevronRight className="w-4 h-4 ml-1" />
              العودة
            </Button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-olive-700 truncate">{course.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>{toHindiDigits(course.video_lectures.length)} محاضرة</span>
            <span>•</span>
            <span>{toHindiDigits(Math.round(course.total_duration_seconds / 60))} دقيقة</span>
          </div>

          <div className="flex items-center gap-3 mt-4 text-sm font-bold text-gray-800">
            <span>{toHindiDigits(progressPercentage)}% تقدم</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
              <div 
                className="h-full bg-olive-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 w-full">
          {course.video_lectures.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا يوجد محتوى متاح حالياً</p>
          ) : (
            course.video_lectures.map((lecture, index) => {
              const isActive = activeLectureId === lecture.id;
              const isCompleted = optimisticCompletedIds.has(lecture.id);
              
              return (
                <button
                  key={lecture.id}
                  onClick={() => {
                    setActiveLectureId(lecture.id);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("lecture", lecture.id);
                    router.push(`?${params.toString()}`);
                    if (window.innerWidth < 1000) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full text-right flex items-start p-4 rounded-xl transition-all border",
                    isActive
                      ? "bg-olive-50 border-olive-200 shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="ml-3 mt-1 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <PlayCircle className={cn("w-6 h-6", isActive ? "text-olive-600" : "text-gray-400")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-bold text-2xl mb-1 truncate", isActive ? "text-olive-800" : "text-gray-800")}>
                      {toHindiDigits(index + 1)}. {lecture.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {lecture.materials.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {toHindiDigits(lecture.materials.length)} مرفقات
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content: Video Player and Materials */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative w-full bg-gray-50">
        {/* Toggle Sidebar Button - absolute top right */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 right-6 z-20 bg-white p-3 rounded-full shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            title="إظهار القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {activeLecture ? (
          <div className="max-w-6xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8 pt-20 md:pt-10">
            
            {/* Top Action Bar */}
            <div className="flex justify-end w-full">
              <Button 
                onClick={handleMarkAsCompleted}
                disabled={isSubmitting || optimisticCompletedIds.has(activeLecture.id)}
                variant={optimisticCompletedIds.has(activeLecture.id) ? "secondary" : "primary"}
                className="px-8 shadow-soft"
              >
                {isSubmitting ? "جاري الحفظ..." : 
                 optimisticCompletedIds.has(activeLecture.id) ? "تم إتمام المحاضرة" : "تحديد المحاضرة كمكتملة"}
              </Button>
            </div>

            {/* Video Player Container - Only render if video_url exists */}
            {activeLecture.video_url && (
              <div className="w-full bg-black rounded-2xl overflow-hidden shadow-soft aspect-video relative">
                <iframe
                  src={
                    activeLecture.video_platform === "youtube"
                      ? `https://www.youtube.com/embed/${activeLecture.video_url.split("v=")[1] || activeLecture.video_url.split("/").pop()}?rel=0`
                      : activeLecture.video_platform === "vimeo"
                      ? `https://player.vimeo.com/video/${activeLecture.video_url.split("/").pop()}`
                      : activeLecture.video_url
                  }
                  title={activeLecture.title}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* Lecture Info & Description */}
            {/* Image Materials */}
            {activeLecture.materials?.filter((m: any) => m.file_type === 'image' || m.file_type === 'IMAGE').map((img: any) => (
              <div key={img.id} className="w-full bg-white rounded-[2.5rem] p-4 shadow-soft border border-gray-100 flex justify-center">
                <img src={getFullImageUrl(img.file) || ""} alt={img.title} className="max-w-full max-h-[70vh] rounded-[2rem] object-contain" />
              </div>
            ))}

            <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-gray-100 flex flex-col gap-6">
              <h2 className="text-3xl font-bold text-gray-900">{activeLecture.title}</h2>
              {activeLecture.description && (
                <p className="text-2xl text-gray-600 whitespace-pre-wrap break-words break-all leading-relaxed font-medium">
                  {activeLecture.description}
                </p>
              )}
            </div>

            {/* Other Materials Section */}
            {activeLecture.materials && activeLecture.materials.filter((m: any) => m.file_type !== 'image' && m.file_type !== 'IMAGE').length > 0 && (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-gray-100 flex flex-col gap-6">
                <h3 className="text-2xl font-bold text-olive-700 flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  المرفقات والملفات
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLecture.materials.filter((m: any) => m.file_type !== 'image' && m.file_type !== 'IMAGE').map((material) => (
                    <a
                      key={material.id}
                      href={material.external_url || getFullImageUrl(material.file) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border border-gray-200 rounded-xl hover:border-olive-300 hover:bg-olive-50 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-olive-100 rounded-lg flex items-center justify-center shrink-0 ml-4 group-hover:bg-olive-200 transition-colors">
                        <FileText className="w-6 h-6 text-olive-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-gray-800 truncate">{material.title}</p>
                        <p className="text-sm text-gray-500 uppercase">{material.file_type}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xl">
            يرجى اختيار محاضرة من القائمة الجانبية للبدء
          </div>
        )}
      </div>
      
    </div>
  );
}
