"use server";

import { apiRequest, publicApiClient, unwrapPaginated } from "@/lib/api";
import { PaginatedResponse } from "@/types/config";
import { LandingPageCourse, LandingPageInstructor, OnlineCourseListItem } from "@/types/entities";
export async function getLandingPageInstructors(): Promise<
  LandingPageInstructor[]
> {
  return apiRequest(
    "Failed to load landing page instructors:",
    async () => {
      const { data } = await publicApiClient.get<
        PaginatedResponse<LandingPageInstructor> | LandingPageInstructor[]
      >("/api/users/landingpageinstructors/?page_size=3");

      return unwrapPaginated(data);
    },
    [],
  );
}

export async function getLandingPageCourses(): Promise<LandingPageCourse[]> {
  return apiRequest(
    "Failed to load landing page courses:",
    async () => {
      const { data } = await publicApiClient.get<
        PaginatedResponse<LandingPageCourse> | LandingPageCourse[]
      >("/api/courses/landingpagecourses/?page_size=6");

      return unwrapPaginated(data);
    },
    [],
  );
}

export async function getPublicOnlineCourses(): Promise<OnlineCourseListItem[]> {
  return apiRequest(
    "Failed to load public online courses:",
    async () => {
      const { data } = await publicApiClient.get<
        PaginatedResponse<OnlineCourseListItem> | OnlineCourseListItem[]
      >("/api/online-courses/courses/?page_size=6");

      return unwrapPaginated(data);
    },
    [],
  );
}
