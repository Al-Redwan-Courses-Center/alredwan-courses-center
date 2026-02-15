"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import {
  EnrollmentListItem,
  EnrollmentRequestListItem,
} from "@/types/entities";
import axios from "axios";

export async function getMyEnrollmentRequests(): Promise<
  EnrollmentRequestListItem[]
> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<
      PaginatedResponse<EnrollmentRequestListItem> | EnrollmentRequestListItem[]
    >("/api/enrollment-requests/my-requests/");

    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load enrollment requests:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load enrollment requests:", error);
    }

    return [];
  }
}

export async function getMyEnrollments(): Promise<EnrollmentListItem[]> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<
      PaginatedResponse<EnrollmentListItem> | EnrollmentListItem[]
    >("/api/enrollments/my-enrollments/");

    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load enrollments:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load enrollments:", error);
    }

    return [];
  }
}
