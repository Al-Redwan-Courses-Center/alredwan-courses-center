"use client";

import { VideoLectureItem } from "@/types/entities";

interface VideoPlayerProps {
  lecture: VideoLectureItem;
}

// NOTE: this is a plain embed. Automatic progress/completion tracking needs a
// real player API (@vimeo/player, the YouTube iframe API, or react-player);
// until then completion is recorded manually from the lecture viewer.
function getEmbedUrl(lecture: VideoLectureItem) {
  const url = lecture.video_url;
  if (!url) return null;

  if (lecture.video_platform === "youtube") {
    const videoId =
      url.split("v=")[1]?.split("&")[0] || url.split("youtu.be/")[1]?.split("?")[0];
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
  }

  if (lecture.video_platform === "vimeo") {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
    if (!videoId) return null;
    return `https://player.vimeo.com/video/${videoId}`;
  }

  // bunny stream or default
  return url;
}

export default function VideoPlayer({ lecture }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(lecture);

  if (!embedUrl) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-lg bg-black text-gray-400 shadow-lg">
        لا يوجد فيديو متاح لهذه المحاضرة
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg">
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
