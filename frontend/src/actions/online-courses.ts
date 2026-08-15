"use server";

import { apiRequest, getAuthApiClient, publicApiClient, unwrapPaginated } from "@/lib/api";
import { PaginatedResponse } from "@/types/config";
import { OnlineCourseListItem, OnlineCourseDetail, VideoWatchProgressItem } from "@/types/entities";
import { getMyEnrollmentRequests, getMyEnrollments } from "@/actions/enrollments";
import { getUser } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function getPublicOnlineCourses(): Promise<OnlineCourseListItem[]> {
  try {
    const { data } = await publicApiClient.get<
      PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
    >("/api/online-courses/courses/?page_size=100");

    return Array.isArray(data) ? data : data.results;
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') throw error;
    console.error("Failed to load public online courses:", error);
    return [];
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
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') throw error;
    console.error("Failed to load public online course details:", error);
    return null;
  }
}

export async function getAllOnlineCourses(): Promise<OnlineCourseListItem[]> {
  return apiRequest(
    "Failed to load online courses:",
    async () => {
      const user = await getUser();
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
      >("/api/online-courses/courses/?page_size=100");

      const courses = unwrapPaginated(data);

      if (user.role !== "student") {
        return courses;
      }

      const myEnrollments = await getMyEnrollments();
      const enrolledCourseIds = new Set(
        myEnrollments
          .filter((e) => e.online_course !== null)
          .map((e) => String(e.online_course))
      );

      return courses.map((c) => ({
        ...c,
        is_enrolled: enrolledCourseIds.has(String(c.id)),
      }));
    },
    [],
  );
}

export async function getOnlineCourseById(
  courseId: string,
): Promise<OnlineCourseDetail | null> {
  return apiRequest(
    "Failed to load online course details:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<OnlineCourseDetail>(
        `/api/online-courses/courses/${courseId}/`,
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
): Promise<VideoWatchProgressItem | null> {
  return apiRequest(
    "Failed to update video progress:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.post<VideoWatchProgressItem>(
        `/api/online-courses/courses/${courseId}/lectures/${lectureId}/progress/`,
        payload
      );

      revalidatePath(`/dashboard/online-courses/${courseId}/learn`);
      revalidatePath(`/dashboard/my-courses`);
      
      return data;
    },
    null,
  );
}
