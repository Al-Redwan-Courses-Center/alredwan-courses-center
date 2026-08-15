"use client";

import { useEffect, useRef } from "react";
import { VideoLectureItem } from "@/types/entities";

interface VideoPlayerProps {
  lecture: VideoLectureItem;
  onProgress: (progress: { playedSeconds: number; played: number }) => void;
  onEnded: () => void;
}

export default function VideoPlayer({ lecture, onProgress, onEnded }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // NOTE: In a real implementation, you'd use @vimeo/player or youtube iframe API
  // or a library like react-player to properly track progress and duration.
  // This is a simplified embed for demonstration purposes based on the platform.

  const getEmbedUrl = () => {
    if (lecture.video_platform === "youtube") {
      const videoId = lecture.video_url.split("v=")[1]?.split("&")[0] || 
                      lecture.video_url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
    }
    if (lecture.video_platform === "vimeo") {
      const videoId = lecture.video_url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    // bunny stream or default
    return lecture.video_url;
  };

  useEffect(() => {
    // Simulated progress tracking since we don't have react-player set up
    const interval = setInterval(() => {
      // Simulate playing 1 second every second
      // In a real app, this data comes from the player API (e.g., YouTube's getCurrentTime)
    }, 5000);
    return () => clearInterval(interval);
  }, [lecture]);

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg">
      <iframe
        ref={iframeRef}
        src={getEmbedUrl()}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
