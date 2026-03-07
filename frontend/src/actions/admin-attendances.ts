"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import {
  StaffAttendanceDetail,
  StaffAttendanceListItem,
} from "@/types/entities";
import { isAxiosError } from "axios";
import { PaginatedResponse } from "@/types/config";

export async function getTodaysAttendances() {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<
      PaginatedResponse<StaffAttendanceListItem>
    >("/api/attendance/today/");

    return data.results;
  } catch (error) {
    const errMssg = "Failed to get today's attendance: ";

    if (isAxiosError(error)) {
      console.error(errMssg, error.response?.data ?? error.message);
    } else {
      console.error(errMssg, error);
    }

    return [];
  }
}

export async function manualCheckIn(id: number) {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.post<StaffAttendanceDetail>(
      `/api/attendance/${id}/manual-check-in/`,
    );

    return data;
  } catch (error) {
    const errMssg = "Failed to manually check in attendance: ";

    if (isAxiosError(error)) {
      console.error(errMssg, error.response?.data ?? error.message);
    } else {
      console.error(errMssg, error);
    }

    return null;
  }
}

export async function manualCheckOut(id: number) {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.post<StaffAttendanceDetail>(
      `/api/attendance/${id}/manual-check-out/`,
    );

    return data;
  } catch (error) {
    const errMssg = "Failed to manually check in attendance: ";

    if (isAxiosError(error)) {
      console.error(errMssg, error.response?.data ?? error.message);
    } else {
      console.error(errMssg, error);
    }

    return null;
  }
}
