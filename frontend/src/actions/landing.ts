"use server";

import { apiRequest, publicApiClient, unwrapPaginated } from "@/lib/api";
import type { PaginatedResponse } from "@/types/config";
import type {
  LandingPageCourse,
  LandingPageInstructor,
} from "@/types/entities";

export async function getLandingPageInstructors(): Promise<
  LandingPageInstructor[]
> {
  return apiRequest("Failed to load landing page instructors:", async () => {
    const { data } = await publicApiClient.get<
      PaginatedResponse<LandingPageInstructor> | LandingPageInstructor[]
    >("/api/users/landingpageinstructors/");

    return unwrapPaginated(data);
  }, []);
}

export async function getLandingPageCourses(): Promise<LandingPageCourse[]> {
  return apiRequest("Failed to load landing page courses:", async () => {
    const { data } = await publicApiClient.get<
      PaginatedResponse<LandingPageCourse> | LandingPageCourse[]
    >("/api/courses/landingpagecourses/?page_size=6");

    return unwrapPaginated(data);
  }, []);
}
