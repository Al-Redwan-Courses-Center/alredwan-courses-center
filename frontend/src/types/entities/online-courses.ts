export interface OnlineCourseListItem {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  instructor: { id: number; name: string; image_url?: string | null } | null;
  price: string;
  allow_replay: boolean;
  access_validity_days: number;
  enrolled_count: number;
  video_count: number;
  total_duration_seconds: number;
  created_at: string;
  updated_at: string;
  is_enrolled?: boolean;
}

export interface VideoLectureItem {
  id: string;
  order: number;
  title: string;
  description: string;
  video_url: string;
  video_platform: "youtube" | "vimeo" | "bunny";
  duration_seconds: number;
  is_live_stream: boolean;
  live_stream_time: string | null;
  materials: OnlineLectureMaterialItem[];
  watch_progress?: VideoWatchProgressItem | null;
}

export interface OnlineLectureMaterialItem {
  id: string;
  title: string;
  file?: string;
  external_url?: string;
  file_type: "pdf" | "image" | "doc";
  order: number;
}

export interface VideoWatchProgressItem {
  id: string;
  watched_seconds: number;
  total_seconds: number;
  completion_percentage: number;
  is_completed: boolean;
  last_position_seconds: number;
  watch_count: number;
  last_watched_at: string;
}

export interface OnlineCourseDetail extends OnlineCourseListItem {
  video_lectures: VideoLectureItem[];
}
