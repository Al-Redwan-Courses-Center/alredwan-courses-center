"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import {
  SupervisorScheduleCreateBody,
  SupervisorScheduleRow,
} from "@/types/entities/supervisor-schedule";
import { Instructor } from "@/types/entities/instructors";
import { PaginatedResponse } from "@/types/config";
import { isAxiosError } from "axios";

function normalizeList<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

function formatActionError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const d = error.response?.data;
  if (d && typeof d === "object") {
    if ("detail" in d && typeof (d as { detail: unknown }).detail === "string") {
      return (d as { detail: string }).detail;
    }
    const parts: string[] = [];
    for (const [key, val] of Object.entries(d)) {
      if (Array.isArray(val)) {
        parts.push(`${key}: ${val.join(" ")}`);
      } else if (typeof val === "string") {
        parts.push(`${key}: ${val}`);
      }
    }
    if (parts.length) return parts.join(" — ");
  }
  return error.response?.statusText || fallback;
}

export async function listSupervisorSchedules(): Promise<SupervisorScheduleRow[]> {
  try {
    const api = await getAuthApiClient();
    const { data } = await api.get<
      PaginatedResponse<SupervisorScheduleRow> | SupervisorScheduleRow[]
    >("/api/attendance/schedules/?page_size=500");
    return normalizeList(data);
  } catch (error) {
    console.error("Failed to list supervisor schedules:", error);
    return [];
  }
}

/** All instructors from the API for schedule assignment (no client-side type filter — backend validates). */
export async function listSupervisorInstructors(): Promise<Instructor[]> {
  try {
    const api = await getAuthApiClient();
    const { data } = await api.get<PaginatedResponse<Instructor> | Instructor[]>(
      "/api/users/instructors/?page_size=1000",
    );
    return normalizeList(data);
  } catch (error) {
    console.error("Failed to list instructors:", error);
    return [];
  }
}

export async function createSupervisorSchedule(
  body: SupervisorScheduleCreateBody,
): Promise<{ ok: true; data: SupervisorScheduleRow } | { ok: false; message: string }> {
  try {
    const api = await getAuthApiClient();
    const { data } = await api.post<SupervisorScheduleRow>(
      "/api/attendance/schedules/",
      body,
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: formatActionError(error, "تعذر إنشاء الجدول"),
    };
  }
}

export async function updateSupervisorSchedule(
  id: number,
  body: Partial<SupervisorScheduleCreateBody>,
): Promise<{ ok: true; data: SupervisorScheduleRow } | { ok: false; message: string }> {
  try {
    const api = await getAuthApiClient();
    const { data } = await api.patch<SupervisorScheduleRow>(
      `/api/attendance/schedules/${id}/`,
      body,
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: formatActionError(error, "تعذر تحديث الجدول"),
    };
  }
}

export async function deleteSupervisorSchedule(
  id: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const api = await getAuthApiClient();
    await api.delete(`/api/attendance/schedules/${id}/`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: formatActionError(error, "تعذر حذف الجدول"),
    };
  }
}
