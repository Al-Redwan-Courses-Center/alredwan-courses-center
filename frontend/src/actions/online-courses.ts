"use server";

import {
  apiRequest,
  getAuthApiClient,
  publicApiClient,
  unwrapPaginated,
} from "@/lib/api";
import { PaginatedResponse } from "@/types/config";
import {
  OnlineCourseListItem,
  OnlineCourseDetail,
  VideoWatchProgressItem,
} from "@/types/entities";
import { getMyEnrollments } from "@/actions/enrollments";
import { getUser } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";

const ONLINE_COURSES_LIST_URL = "/api/online-courses/courses/?page_size=100";

export async function getPublicOnlineCourses(): Promise<
  OnlineCourseListItem[]
> {
  return apiRequest(
    "Failed to load public online courses:",
    async () => {
      const { data } = await publicApiClient.get<
        PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
      >(ONLINE_COURSES_LIST_URL);

      return unwrapPaginated(data);
    },
    [],
  );
}

// Cached so `generateMetadata` and the page share one request per render.
export const getPublicOnlineCourseById = cache(
  async function getPublicOnlineCourseById(
    courseId: string,
  ): Promise<OnlineCourseDetail | null> {
    return apiRequest(
      "Failed to load public online course details:",
      async () => {
        const { data } = await publicApiClient.get<OnlineCourseDetail>(
          `/api/online-courses/courses/${courseId}/`,
        );

        return data;
      },
      null,
    );
  },
);

export async function getAllOnlineCourses(): Promise<OnlineCourseListItem[]> {
  return apiRequest(
    "Failed to load online courses:",
    async () => {
      const [user, apiClient, myEnrollments] = await Promise.all([
        getUser(),
        getAuthApiClient(),
        getMyEnrollments().catch(() => []),
      ]);

      const { data } = await apiClient.get<
        PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
      >(ONLINE_COURSES_LIST_URL);

      const courses = unwrapPaginated(data);

      if (user.role !== "student") {
        return courses;
      }

      const enrolledCourseIds = new Set(
        myEnrollments
          .filter((e) => e.online_course !== null)
          .map((e) => String(e.online_course)),
      );

      return courses.map((c) => ({
        ...c,
        is_enrolled: enrolledCourseIds.has(String(c.id)),
      }));
    },
    [],
  );
}

/** Online courses assigned to one instructor (the "جميع الدورات" online tab). */
export async function getInstructorOnlineCourses(
  instructorId: string | number | undefined,
): Promise<OnlineCourseListItem[]> {
  if (!instructorId) return [];

  return apiRequest(
    "Failed to load instructor online courses:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
      >("/api/online-courses/courses/", {
        params: { instructor: instructorId, page_size: 100 },
      });

      return unwrapPaginated(data);
    },
    [],
  );
}

// `childId` is required for parents: it says whose watch progress to return.
export async function getOnlineCourseById(
  courseId: string,
  childId?: string | null,
): Promise<OnlineCourseDetail | null> {
  return apiRequest(
    "Failed to load online course details:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<OnlineCourseDetail>(
        `/api/online-courses/courses/${courseId}/`,
        { params: childId ? { child: childId } : undefined },
      );

      return data;
    },
    null,
  );
}

/** Loads several online courses (with the viewer's watch progress) in one request. */
export async function getOnlineCoursesByIds(
  courseIds: (string | number)[],
): Promise<OnlineCourseDetail[]> {
  if (courseIds.length === 0) return [];

  return apiRequest(
    "Failed to load online courses batch:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        OnlineCourseDetail[] | PaginatedResponse<OnlineCourseDetail>
      >("/api/online-courses/courses/batch/", {
        params: { ids: courseIds.join(",") },
      });

      return unwrapPaginated(data);
    },
    [],
  );
}

export async function updateVideoWatchProgress(
  courseId: string,
  lectureId: string,
  payload: {
    watched_seconds: number;
    total_seconds: number;
    last_position_seconds: number;
  },
  childId?: string | null,
): Promise<VideoWatchProgressItem | null> {
  return apiRequest(
    "Failed to update video progress:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.post<VideoWatchProgressItem>(
        `/api/online-courses/courses/${courseId}/lectures/${lectureId}/progress/`,
        childId ? { ...payload, child: childId } : payload,
      );

      revalidatePath(`/dashboard/online-courses/${courseId}/learn`);
      revalidatePath("/dashboard/my-courses");
      revalidatePath("/dashboard/overview");

      return data;
    },
    null,
  );
}
