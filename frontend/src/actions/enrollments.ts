"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import {
  EnrollmentListItem,
  EnrollmentProgress,
  EnrollmentRequestCreateBody,
  EnrollmentRequestListItem,
  InstructorEnrollmentListItem,
} from "@/types/entities";
import axios, { isAxiosError } from "axios";

export interface CreateEnrollmentRequestResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

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

export async function getInstructorEnrollmentsByCourseId(courseId: string) {
  try {
    const apiClient = await getAuthApiClient();
    const {
      data: { results },
    } = await apiClient.get<PaginatedResponse<InstructorEnrollmentListItem>>(
      `/api/instructor/courses/${courseId}/enrollments?page_size=100`,
    );

    return results;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to get course enrollments: ",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to get course enrollments: ", error);
    }

    return [];
  }
}

export async function createEnrollmentRequest(
  payload: EnrollmentRequestCreateBody,
): Promise<CreateEnrollmentRequestResult> {
  try {
    const apiClient = await getAuthApiClient();

    await apiClient.post("/api/enrollment-requests/", payload);

    return {
      ok: true,
      message: "تم إرسال طلب الإلتحاق بنجاح.",
    };
  } catch (error) {
    if (isAxiosError(error)) {
      const responseData = error.response?.data as
        | Record<string, string[] | string>
        | { detail?: string | string[] }
        | undefined;

      const detail = responseData?.detail;
      const detailMessage = Array.isArray(detail) ? detail[0] : detail;

      return {
        ok: false,
        message:
          detailMessage || "تعذر إرسال طلب الإلتحاق. يرجى المحاولة مرة أخرى.",
        fieldErrors:
          responseData && !Array.isArray(responseData)
            ? Object.fromEntries(
                Object.entries(responseData).map(([key, value]) => [
                  key,
                  Array.isArray(value) ? value : [String(value)],
                ]),
              )
            : undefined,
      };
    }

    return {
      ok: false,
      message: "حدث خطأ غير متوقع أثناء إرسال الطلب.",
    };
  }
}
