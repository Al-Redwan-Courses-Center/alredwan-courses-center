"use client";

import { VideoLectureItem } from "@/types/entities";

interface VideoPlayerProps {
  lecture: VideoLectureItem;
}

function parseYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  return match ? match[1] : null;
}

function parseVimeoId(url: string): string | null {
  const match = url.match(
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/\d+\/video\/|video\/|))(\d+)/i,
  );
  return match ? match[1] : null;
}

function getEmbedUrl(lecture: VideoLectureItem): string | null {
  const url = lecture.video_url?.trim();
  if (!url) return null;

  if (lecture.video_platform === "youtube" || url.includes("youtu")) {
    const videoId = parseYouTubeId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
  }

  if (lecture.video_platform === "vimeo" || url.includes("vimeo.com")) {
    const videoId = parseVimeoId(url);
    if (!videoId) return null;
    return `https://player.vimeo.com/video/${videoId}`;
  }

  return url;
}

export default function VideoPlayer({ lecture }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(lecture);

  if (!embedUrl) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl bg-black text-gray-400 shadow-soft">
        <p className="text-xl font-medium">لا يوجد فيديو متاح لهذه المحاضرة أو غير مصرح بالمشاهدة</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-soft">
      <iframe
        src={embedUrl}
        title={lecture.title}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
