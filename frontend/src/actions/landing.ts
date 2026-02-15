"use server";

import apiClient from "@/lib/axios";
import { PaginatedResponse } from "@/types/config";
import { LandingPageCourse, LandingPageInstructor } from "@/types/entities";
import axios from "axios";

export async function getLandingPageInstructors(): Promise<
  LandingPageInstructor[]
> {
  try {
    const { data } = await apiClient.get<
      PaginatedResponse<LandingPageInstructor> | LandingPageInstructor[]
    >("/api/users/landingpageinstructors/?page_size=3");

    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load landing page instructors:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load landing page instructors:", error);
    }

    return [];
  }
}

export async function getLandingPageCourses(): Promise<LandingPageCourse[]> {
  try {
    const { data } = await apiClient.get<
      PaginatedResponse<LandingPageCourse> | LandingPageCourse[]
    >("/api/courses/landingpagecourses/?page_size=6");

    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load landing page courses:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load landing page courses:", error);
    }

    return [];
  }
}
