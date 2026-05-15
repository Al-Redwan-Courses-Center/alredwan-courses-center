"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { ParentChildDetail } from "@/actions/user";
import { isAxiosError } from "axios";

export interface CreateChildPayload {
  first_name: string;
  last_name: string;
  dob: string; // YYYY-MM-DD
  gender: "boy" | "girl";
  phone?: string;
  image?: File;
}

export interface UpdateChildPayload {
  first_name?: string;
  last_name?: string;
  dob?: string; // YYYY-MM-DD
  gender?: "boy" | "girl";
  phone?: string;
  image?: File;
}

export interface ChildMutationResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: ParentChildDetail;
}

/**
 * Create a new child for the authenticated parent.
 * Supports image upload via multipart/form-data.
 */
export async function createChild(
  payload: CreateChildPayload,
): Promise<ChildMutationResult> {
  try {
    const apiClient = await getAuthApiClient();

    // Build FormData for multipart upload when image is present
    const formData = new FormData();
    formData.append("first_name", payload.first_name);
    formData.append("last_name", payload.last_name);
    formData.append("dob", payload.dob);
    formData.append("gender", payload.gender);
    if (payload.phone) {
      formData.append("phone", payload.phone);
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const { data } = await apiClient.post<ParentChildDetail>(
      "/api/parents/children/create/",
      formData,
    );

    return {
      ok: true,
      message: `تم إضافة الطفل ${data.first_name} بنجاح.`,
      data,
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
        message: detailMessage || "تعذر إضافة الطفل. يرجى المحاولة مرة أخرى.",
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
      message: "حدث خطأ غير متوقع أثناء إضافة الطفل.",
    };
  }
}

/**
 * Update an existing child's information.
 * Only the primary parent can update their child.
 * Supports image upload via multipart/form-data.
 */
export async function updateChild(
  childId: string,
  payload: UpdateChildPayload,
): Promise<ChildMutationResult> {
  try {
    const apiClient = await getAuthApiClient();

    // Build FormData for multipart upload when image is present
    const formData = new FormData();
    if (payload.first_name !== undefined) {
      formData.append("first_name", payload.first_name);
    }
    if (payload.last_name !== undefined) {
      formData.append("last_name", payload.last_name);
    }
    if (payload.dob !== undefined) {
      formData.append("dob", payload.dob);
    }
    if (payload.gender !== undefined) {
      formData.append("gender", payload.gender);
    }
    if (payload.phone !== undefined) {
      formData.append("phone", payload.phone);
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const { data } = await apiClient.patch<ParentChildDetail>(
      `/api/parents/children/${childId}/update/`,
      formData,
    );

    return {
      ok: true,
      message: `تم تحديث معلومات ${data.first_name} بنجاح.`,
      data,
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
          detailMessage || "تعذر تحديث معلومات الطفل. يرجى المحاولة مرة أخرى.",
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
      message: "حدث خطأ غير متوقع أثناء تحديث معلومات الطفل.",
    };
  }
}

/**
 * Delete a child.
 * Only the primary parent can delete their child.
 */
export async function deleteChild(
  childId: string,
): Promise<ChildMutationResult> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.delete<{
      message: string;
      child_name: string;
    }>(`/api/parents/children/${childId}/delete/`);

    return {
      ok: true,
      message: `تم حذف الطفل ${data.child_name} بنجاح.`,
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
        message: detailMessage || "تعذر حذف الطفل. يرجى المحاولة مرة أخرى.",
      };
    }

    return {
      ok: false,
      message: "حدث خطأ غير متوقع أثناء حذف الطفل.",
    };
  }
}
