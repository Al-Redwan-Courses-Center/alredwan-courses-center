"use server";

import { apiRequest, getAuthApiClient, publicApiClient, unwrapPaginated, toPaginatedResponse } from "@/lib/api";
import { PaginatedResponse } from "@/types/config";
import { OnlineCourseListItem, OnlineCourseDetail, VideoWatchProgressItem } from "@/types/entities";
import { getMyEnrollments } from "@/actions/enrollments";
import { getUser } from "@/actions/auth";
import { revalidatePath } from "next/cache";

import { CourseQueryParams } from "@/actions/courses";

export async function getPublicOnlineCourses(
  params?: CourseQueryParams,
): Promise<PaginatedResponse<OnlineCourseListItem>> {
  try {
    const { data } = await publicApiClient.get<
      PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
    >("/api/online-courses/courses/", {
      params: {
        page_size: params?.page_size ?? 8,
        ...params,
      },
    });

    return toPaginatedResponse(data, params?.page_size ?? 8);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to load public online courses:", error);
    return {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: 1,
      page_size: params?.page_size ?? 8,
      results: [],
    };
  }
}

export async function getPublicOnlineCourseById(
  courseId: string,
): Promise<OnlineCourseDetail | null> {
  try {
    const { data } = await publicApiClient.get<OnlineCourseDetail>(
      `/api/online-courses/courses/${courseId}/`,
    );
    return data;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to load public online course details:", error);
    return null;
  }
}

export async function getAllOnlineCourses(
  params?: CourseQueryParams,
): Promise<PaginatedResponse<OnlineCourseListItem>> {
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
      >("/api/online-courses/courses/", {
        params: {
          page_size: params?.page_size ?? 8,
          ...params,
        },
      });

      const paginated = toPaginatedResponse(data, params?.page_size ?? 8);

      if (user.role !== "student") {
        return paginated;
      }

      const enrolledCourseIds = new Set(
        myEnrollments
          .filter((e) => e.online_course !== null)
          .map((e) => String(e.online_course)),
      );

      return {
        ...paginated,
        results: paginated.results.map((c) => ({
          ...c,
          is_enrolled: enrolledCourseIds.has(String(c.id)),
        })),
      };
    },
    {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: 1,
      page_size: params?.page_size ?? 8,
      results: [],
    },
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

export async function updateVideoWatchProgress(
  courseId: string,
  lectureId: string,
  payload: { watched_seconds: number; total_seconds: number; last_position_seconds: number },
  childId?: string | null,
): Promise<VideoWatchProgressItem | null> {
  return apiRequest(
    "Failed to update video progress:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.post<VideoWatchProgressItem>(
        `/api/online-courses/courses/${courseId}/lectures/${lectureId}/progress/`,
        childId ? { ...payload, child: childId } : payload
      );

      revalidatePath(`/dashboard/online-courses/${courseId}/learn`);
      revalidatePath(`/dashboard/my-courses`);
      
      return data;
    },
    null,
  );
}
