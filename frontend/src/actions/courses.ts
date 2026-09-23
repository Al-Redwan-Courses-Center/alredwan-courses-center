"use server";

import { getUser } from "@/actions/auth";
import {
  getEnrollmentProgressById,
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import { getOnlineCoursesByIds } from "@/actions/online-courses";
import {
  apiRequest,
  getAuthApiClient,
  publicApiClient,
  toPaginatedResponse,
} from "@/lib/api";
import { getOnlineCourseProgress } from "@/lib/online-courses";
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
  const pageSize = params?.page_size ?? 8;

  return apiRequest(
    "Failed to load public courses:",
    async () => {
      const { data } = await publicApiClient.get<
        PaginatedResponse<CourseListItem> | CourseListItem[]
      >("/api/courses/", {
        params: {
          page_size: pageSize,
          ...params,
        },
      });

      return toPaginatedResponse(data, pageSize);
    },
    {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: 1,
      page_size: pageSize,
      results: [],
    },
  );
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
      const myRequests = await getMyEnrollmentRequests();

      const pendingRequests = myRequests.filter(
        (r) => r.status === "pending" || r.status === "processing",
      );

      const physicalEnrollments = myEnrollments.filter(
        (e) => e.course !== null,
      );
      const onlineEnrollments = myEnrollments.filter(
        (e) => e.online_course !== null,
      );

      const physicalRequests = pendingRequests.filter((r) => r.course !== null);
      const onlineRequests = pendingRequests.filter(
        (r) => r.online_course !== null,
      );

      const getUniqueIds = <T, K extends keyof T>(
        arr: T[],
        key: K,
      ): NonNullable<T[K]>[] =>
        Array.from(
          new Set(
            arr
              .map((item) => item[key])
              .filter(
                (val): val is NonNullable<T[K]> =>
                  val !== null && val !== undefined,
              ),
          ),
        );

      const physicalCourseIds = getUniqueIds(
        [...physicalEnrollments, ...physicalRequests],
        "course",
      );
      const onlineCourseIds = getUniqueIds(
        [...onlineEnrollments, ...onlineRequests],
        "online_course",
      );

      const [myCoursesInitial, myEnrollmentsProgresses] = await Promise.all([
        Promise.all(physicalCourseIds.map((id) => getCourseById(id as number))),
        Promise.all(
          physicalEnrollments.map((e) => getEnrollmentProgressById(e.id)),
        ),
      ]);

      const physical = myCoursesInitial
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map((c) => {
          const isPending = !physicalEnrollments.find(
            (e) => e.course === c?.id,
          );
          const req = physicalRequests.find((r) => r.course === c?.id);
          const activeIndex = physicalEnrollments.findIndex(
            (e) => e.course === c?.id,
          );

          return {
            ...c,
            course_progress: isPending
              ? 0
              : myEnrollmentsProgresses[activeIndex]?.percentage || 0,
            type: "physical" as const,
            enrollment_status: isPending ? req?.status : "active",
            enrollment_status_display: isPending ? req?.status_display : "نشط",
          };
        });

      const onlineCoursesInitial = await getOnlineCoursesByIds(onlineCourseIds);

      const online = onlineCoursesInitial.map((c) => {
        const isPending = !onlineEnrollments.find(
          (e) => e.online_course === c.id,
        );
        const req = onlineRequests.find((r) => r.online_course === c.id);

        return {
          ...c,
          course_progress: getOnlineCourseProgress(c.video_lectures),
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
