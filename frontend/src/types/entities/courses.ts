export interface CourseTagLite {
  id: number;
  name: string;
}

export interface CourseSeasonLite {
  id: number;
  name: string;
  season_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CourseInstructorLite {
  id: number;
  name: string;
  image_url?: string | null;
}

export interface CourseListItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  start_date: string;
  end_date: string | null;
  num_lectures: number;
  capacity: number;
  price: string;
  is_active: boolean;
  season: CourseSeasonLite;
  instructor: CourseInstructorLite;
  tags: CourseTagLite[];
  for_adults: boolean;
  min_age: number | null;
  max_age: number | null;
  enrolled_count: number;
  available_spots: number;
  is_full: boolean;
  created_at: string;
  updated_at: string;
  average_rating: number | null;
  rating_count: number;
}

export interface CourseScheduleDetail {
  id: number;
  course?: number;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
}

export interface CourseDetail
  extends Omit<CourseListItem, "average_rating" | "rating_count"> {
  schedules: CourseScheduleDetail[];
}

export type StudentPhysicalCourse = CourseDetail & {
  course_progress: number;
  type: "physical";
  enrollment_status?: string;
  enrollment_status_display?: string;
};

export type StudentOnlineCourse = import("./online-courses").OnlineCourseDetail & {
  course_progress: number;
  type: "online";
  enrollment_status?: string;
  enrollment_status_display?: string;
};

export type StudentCourseItem = StudentPhysicalCourse | StudentOnlineCourse;

export interface LandingPageCourse {
  id: number;
  order: number;
  created_at: string;
  course: CourseListItem;
}

// TODO(types): Unused entity type; reintroduce when an API uses it.
/*
export interface CourseStats {
  lectures: number;
}
*/

// TODO(types): Unused entity type; reintroduce when an API uses it.
/*
export interface CourseImages {
  cover: string;
}
*/
