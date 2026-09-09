"use server";

import { revalidatePath } from "next/cache";
import {
  apiRequest,
  getAuthApiClient,
  toPaginatedResponse,
} from "@/lib/api";
import type { PaginatedResponse } from "@/types/config";
import type { MemoryListItem, ParticipantSearchResult } from "@/types/entities";
import { isAxiosError } from "axios";

export async function getGeneralMemories(
  page = 1,
  page_size = 12,
): Promise<PaginatedResponse<MemoryListItem>> {
  return apiRequest(
    "Failed to load general memories:",
    async () => {
      const apiClient = await getAuthApiClient();
      const { data } = await apiClient.get<
        PaginatedResponse<MemoryListItem> | MemoryListItem[]
      >(`/api/memories/feed/general/?page=${page}&page_size=${page_size}`);
      return toPaginatedResponse(data, page_size);
    },
    {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: page,
      page_size,
      results: [],
    },
  );
}

export async function getPrivateMemories(
  childId?: string,
  page = 1,
  page_size = 12,
): Promise<PaginatedResponse<MemoryListItem>> {
  return apiRequest(
    "Failed to load private memories:",
    async () => {
      const apiClient = await getAuthApiClient();
      const url = childId
        ? `/api/memories/feed/private/?child_id=${childId}&page=${page}&page_size=${page_size}`
        : `/api/memories/feed/private/?page=${page}&page_size=${page_size}`;
      const { data } = await apiClient.get<
        PaginatedResponse<MemoryListItem> | MemoryListItem[]
      >(url);
      return toPaginatedResponse(data, page_size);
    },
    {
      count: 0,
      next: null,
      previous: null,
      total_pages: 0,
      current_page: page,
      page_size,
      results: [],
    },
  );
}

export async function searchParticipants(
  query: string,
): Promise<ParticipantSearchResult[]> {
  return apiRequest(
    "Failed to search participants:",
    async () => {
      if (query.length < 2) return [];
      const apiClient = await getAuthApiClient();
      const { data } = await apiClient.get<ParticipantSearchResult[]>(
        `/api/memories/participants/search/?q=${encodeURIComponent(query)}`,
      );
      return data;
    },
    [],
  );
}

export async function deleteMemory(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const apiClient = await getAuthApiClient();
    await apiClient.delete(`/api/memories/${id}/`);
    revalidatePath("/dashboard/memories");
    return { ok: true, message: "تم حذف الذكرى بنجاح" };
  } catch (error: unknown) {
    const message =
      isAxiosError<{ detail: string }>(error) && error.response?.data.detail
        ? error.response.data.detail
        : "حدث خطأ أثناء حذف الذكرى";

    return {
      ok: false,
      message,
    };
  }
}

export interface CloudinarySignatureData {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
}

export async function getCloudinarySignatureAction(): Promise<{
  ok: boolean;
  data?: CloudinarySignatureData;
  message?: string;
}> {
  try {
    const apiClient = await getAuthApiClient();
    const res = await apiClient.get<CloudinarySignatureData>(
      "/api/memories/cloudinary/signature/",
    );
    return { ok: true, data: res.data };
  } catch (error: unknown) {
    const message =
      isAxiosError<{ detail: string }>(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "فشل في الحصول على توقيع الرفع";
    return { ok: false, message };
  }
}

export interface CreateMemoryPayload {
  file: string;
  media_type: "image" | "video";
  caption?: string;
  children?: (string | number)[];
  students?: (string | number)[];
}

export async function createMemoryAction(payload: CreateMemoryPayload): Promise<{
  ok: boolean;
  message?: string;
  data?: MemoryListItem;
}> {
  try {
    const apiClient = await getAuthApiClient();
    const res = await apiClient.post<MemoryListItem>(
      "/api/memories/upload/",
      payload,
    );
    revalidatePath("/dashboard/memories");
    return { ok: true, data: res.data };
  } catch (error: unknown) {
    const message =
      isAxiosError<{ detail: string }>(error) && error.response?.data?.detail
        ? error.response.data.detail
        : "فشل تسجيل الرفع في النظام";
    return { ok: false, message };
  }
}

