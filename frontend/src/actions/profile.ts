"use server";

import { isAxiosError } from "axios";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getServerJwtToken } from "@/actions/auth";
import { getAuthApiClient } from "@/lib/auth-api";
import type { UserEntity } from "@/types/auth";

export async function updateProfile(data: {
  first_name: string;
  last_name: string;
  email?: string;
  dob: string;
  address?: string;
}) {
  try {
    const apiClient = await getAuthApiClient();
    const response = await apiClient.patch("/auth/users/me/", data);
    revalidatePath("/dashboard/profile");
    return { data: response.data, error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (isAxiosError(error)) {
      return {
        data: null,
        error: error.response?.data ?? "حدث خطأ أثناء تحديث الملف الشخصي",
      };
    }
    return { data: null, error: "حدث خطأ غير متوقع" };
  }
}

export interface MeWithStatus {
  user: UserEntity | null;
  /** True when the backend rejected the session token (401/403). */
  unauthorized: boolean;
}

/**
 * Loads the signed-in user from the backend and says whether the session
 * token itself was rejected, so callers can sign out instead of rendering a
 * dashboard that fails every request.
 */
export async function getMeWithStatus(): Promise<MeWithStatus> {
  try {
    const token = await getServerJwtToken();
    if (!token?.jwt_access_token) return { user: null, unauthorized: false };

    const response = await fetch(`${process.env.REST_API_URL}/auth/users/me/`, {
      headers: {
        Authorization: `JWT ${token.jwt_access_token}`,
      },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      console.error("Session token rejected by the API:", response.status);
      return { user: null, unauthorized: true };
    }

    if (!response.ok) {
      console.error("getMe failed:", response.status, await response.text());
      return { user: null, unauthorized: false };
    }

    return { user: (await response.json()) as UserEntity, unauthorized: false };
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error("getMe failed:", error);
    return { user: null, unauthorized: false };
  }
}

export async function getMe() {
  try {
    const { user } = await getMeWithStatus();
    return user;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function uploadProfileImage(formData: FormData) {
  try {
    const token = await getServerJwtToken();
    if (!token?.jwt_access_token)
      return { data: null, error: "Authentication required" };

    const response = await fetch(`${process.env.REST_API_URL}/auth/users/me/`, {
      method: "PATCH",
      headers: {
        Authorization: `JWT ${token.jwt_access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Upload failed:", response.status, errorData);
      return { data: null, error: "حدث خطأ أثناء رفع الصورة" };
    }

    const data = await response.json();
    revalidatePath("/dashboard/profile");
    revalidatePath("/");
    return { data: data, error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Upload error:", error);
    return { data: null, error: "حدث خطأ أثناء رفع الصورة" };
  }
}
