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
  unwrapPaginated,
} from "@/lib/api";
import type { PaginatedResponse } from "@/types/config";
import type { CourseDetail, CourseListItem } from "@/types/entities";

export async function getPublicCourses(): Promise<CourseListItem[]> {
  try {
    const { data } = await publicApiClient.get<
      PaginatedResponse<CourseListItem> | CourseListItem[]
    >("/api/courses/?page_size=100");

    return Array.isArray(data) ? data : data.results;
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
    return [];
  }
}

export async function getAllCourses(): Promise<CourseListItem[]> {
  return apiRequest(
    "Failed to load courses:",
    async () => {
      const user = await getUser();
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<CourseListItem> | CourseListItem[]
      >("/api/courses/?page_size=100");

      const courses = unwrapPaginated(data);

      if (user.role !== "student") {
        return courses;
      }

      const enrollmentsCoursesIds = (await getMyEnrollments()).map(
        (e) => e.course,
      );

      const pendingOrProcessingRequestCourseIds = (
        await getMyEnrollmentRequests()
      )
        .filter((request) => ["pending", "processing"].includes(request.status))
        .map((request) => request.course);

      return courses.filter(
        (c) =>
          !enrollmentsCoursesIds.includes(c.id) &&
          !pendingOrProcessingRequestCourseIds.includes(c.id),
      );
    },
    [],
  );
}

export async function getInstructorCourses(
  instructorId: string | undefined,
): Promise<CourseListItem[]> {
  if (!instructorId) return [];

  return apiRequest(
    "Failed to load instructor courses:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<CourseListItem> | CourseListItem[]
      >(`/api/courses/?page_size=100&instructor=${instructorId}`);

      return unwrapPaginated(data);
    },
    [],
  );
}

export async function getCourseById(
  courseId: number | string,
): Promise<CourseDetail | null> {
  return apiRequest(
    "Failed to load course details:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<CourseDetail>(
        `/api/courses/${courseId}/`,
      );

      return data;
    },
    null,
  );
}

export async function getStudentCourses(): Promise<(CourseDetail & { course_progress: number })[]> {
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
        .filter((c): c is CourseDetail & { course_progress: number } => c !== null);
    },
    [],
  );
}
