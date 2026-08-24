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
      const myRequests = await getMyEnrollmentRequests();

      const pendingRequests = myRequests.filter(
        (r) => r.status === "pending" || r.status === "processing"
      );

      const physicalEnrollments = myEnrollments.filter((e) => e.course !== null);
      const onlineEnrollments = myEnrollments.filter((e) => e.online_course !== null);

      const physicalRequests = pendingRequests.filter((r) => r.course !== null);
      const onlineRequests = pendingRequests.filter((r) => r.online_course !== null);

      const getUniqueIds = (arr: any[], key: string) =>
        Array.from(new Set(arr.map((item) => item[key]!)));

      const physicalCourseIds = getUniqueIds(
        [...physicalEnrollments, ...physicalRequests],
        "course"
      );
      const onlineCourseIds = getUniqueIds(
        [...onlineEnrollments, ...onlineRequests],
        "online_course"
      );

      const [myCoursesInitial, myEnrollmentsProgresses] = await Promise.all([
        Promise.all(physicalCourseIds.map((id) => getCourseById(id))),
        Promise.all(physicalEnrollments.map((e) => getEnrollmentProgressById(e.id))),
      ]);

      const physical = myCoursesInitial
        .filter((c) => c !== null)
        .map((c, i) => {
          const isPending = !physicalEnrollments.find((e) => e.course === c?.id);
          const req = physicalRequests.find((r) => r.course === c?.id);
          const activeIndex = physicalEnrollments.findIndex((e) => e.course === c?.id);

          return {
            ...c,
            course_progress: isPending ? 0 : myEnrollmentsProgresses[activeIndex]?.percentage || 0,
            type: "physical" as const,
            enrollment_status: isPending ? req?.status : "active",
            enrollment_status_display: isPending ? req?.status_display : "نشط",
          };
        });

      const apiClient = await getAuthApiClient();
      let onlineCoursesInitial: any[] = [];
      if (onlineCourseIds.length > 0) {
        const res = await apiClient
          .get(`/api/online-courses/courses/batch/`, {
            params: { ids: onlineCourseIds.join(",") },
          })
          .catch(() => ({ data: [] }));
        onlineCoursesInitial = res.data;
      }

      const online = onlineCoursesInitial
        .filter((c) => c !== null)
        .map((c: any) => {
          const isPending = !onlineEnrollments.find((e) => e.online_course === c?.id);
          const req = onlineRequests.find((r) => r.online_course === c?.id);

          const completedLecturesCount = c.video_lectures?.filter((l: any) => l.watch_progress?.is_completed).length || 0;
          const progressPercentage = c.video_lectures?.length > 0 
            ? Math.round((completedLecturesCount / c.video_lectures.length) * 100) 
            : 0;

          return {
            ...c,
            course_progress: progressPercentage,
            type: "online" as const,
            enrollment_status: isPending ? req?.status : "active",
            enrollment_status_display: isPending ? req?.status_display : "نشط",
          };
        });

      return [...physical, ...online];
    },
    [],
  );
}
