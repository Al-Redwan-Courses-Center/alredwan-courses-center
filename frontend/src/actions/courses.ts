"use server";

import { getUser } from "@/actions/auth";
import {
  getEnrollmentProgressById,
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import {
  apiRequest,
  getAuthApiClient,
  publicApiClient,
  toPaginatedResponse,
  unwrapPaginated,
} from "@/lib/api";
import type { PaginatedResponse } from "@/types/config";
import type {
  CourseDetail,
  CourseListItem,
  StudentCourseItem,
} from "@/types/entities";

export interface CourseQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  season?: string | number;
  instructor?: string | number;
  for_adults?: boolean;
  tags?: string | number;
  price__gte?: number;
  price__lte?: number;
  start_date__gte?: string;
  start_date__lte?: string;
  ordering?: string;
  is_active?: boolean;
}

export async function getPublicCourses(
  params?: CourseQueryParams,
): Promise<PaginatedResponse<CourseListItem>> {
  try {
    const { data } = await publicApiClient.get<
      PaginatedResponse<CourseListItem> | CourseListItem[]
    >("/api/courses/", {
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
    console.error("Failed to load public courses:", error);
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

export async function getAllCourses(
  params?: CourseQueryParams,
): Promise<PaginatedResponse<CourseListItem>> {
  return apiRequest(
    "Failed to load courses:",
    async () => {
      const user = await getUser();
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<CourseListItem> | CourseListItem[]
      >("/api/courses/", {
        params: {
          page_size: params?.page_size ?? 8,
          ...params,
        },
      });

      const paginated = toPaginatedResponse(data, params?.page_size ?? 8);

      if (user.role !== "student") {
        return paginated;
      }

      const enrollmentsCoursesIds = (await getMyEnrollments()).map(
        (e) => e.course,
      );

      const pendingOrProcessingRequestCourseIds = (
        await getMyEnrollmentRequests()
      )
        .filter((request) => ["pending", "processing"].includes(request.status))
        .map((request) => request.course);

      const filteredResults = paginated.results.filter(
        (c) =>
          !enrollmentsCoursesIds.includes(c.id) &&
          !pendingOrProcessingRequestCourseIds.includes(c.id),
      );

      return {
        ...paginated,
        results: filteredResults,
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

export async function getInstructorCourses(
  instructorId: string | undefined,
  params?: CourseQueryParams,
): Promise<PaginatedResponse<CourseListItem>> {
  if (!instructorId) {
    return {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: 1,
      page_size: params?.page_size ?? 10,
      results: [],
    };
  }

  return apiRequest(
    "Failed to load instructor courses:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<CourseListItem> | CourseListItem[]
      >("/api/courses/", {
        params: {
          instructor: instructorId,
          page_size: params?.page_size ?? 10,
          ...params,
        },
      });

      return toPaginatedResponse(data, params?.page_size ?? 10);
    },
    {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: 1,
      page_size: params?.page_size ?? 10,
      results: [],
    },
  );
}

export async function getCourseById(
  courseId: number | string,
): Promise<CourseDetail | null> {
  return apiRequest(
    "Failed to load course details:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await publicApiClient.get<CourseDetail>(
        `/api/courses/${courseId}/`,
      );
      return data;
    },
    null,
  );
}

export async function getStudentCourses(): Promise<StudentCourseItem[]> {
  return apiRequest(
    "Failed to load student courses:",
    async () => {
      const myEnrollments = await getMyEnrollments();

      const myCoursesInitial = await Promise.all(
        myEnrollments.map((e) => getCourseById(e.course)),
      );
      const myEnrollmentsProgresses = await Promise.all(
        myEnrollments.map((e) => getEnrollmentProgressById(e.id)),
      );

      return myCoursesInitial
        .map((c, i) => {
          if (!c) return null;
          return {
            ...c,
            course_progress: myEnrollmentsProgresses[i]?.percentage ?? 0,
          };
        })
        .filter(
          (c): c is CourseDetail & { course_progress: number } => c !== null,
        );
    },
    [],
  );
}
