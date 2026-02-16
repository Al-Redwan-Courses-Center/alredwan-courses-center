"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import {
  EnrollmentListItem,
  EnrollmentProgress,
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
    >("/api/enrollment-requests/my-requests/?page_size=100");

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
    >("/api/enrollments/my-enrollments/?page_size=100");

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

export async function getEnrollmentProgressById(
  enrollmentId: string,
): Promise<EnrollmentProgress | null> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<EnrollmentProgress>(
      `/api/enrollments/${enrollmentId}/progress`,
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load enrollments:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load enrollments:", error);
    }

    return null;
  }
}
