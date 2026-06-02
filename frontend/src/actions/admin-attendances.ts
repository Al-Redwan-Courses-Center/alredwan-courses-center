"use server";

import { apiRequest, getAuthApiClient } from "@/lib/api";
import { PaginatedResponse } from "@/types/config";
import {
  StaffAttendanceDetail,
  StaffAttendanceListItem,
} from "@/types/entities";

export async function getTodaysAttendances() {
  return apiRequest(
    "Failed to get today's attendance: ",
    async () => {
      const apiClient = await getAuthApiClient();
      const { data } = await apiClient.get<
        PaginatedResponse<StaffAttendanceListItem>
      >("/api/attendance/today/");

      return data.results;
    },
    [],
  );
}

export async function manualCheckIn(id: number) {
  return apiRequest(
    "Failed to manually check in attendance: ",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.post<StaffAttendanceDetail>(
        `/api/attendance/${id}/manual-check-in/`,
      );

      return data;
    },
    null,
  );
}

export async function manualCheckOut(id: number) {
  return apiRequest(
    "Failed to manually check out attendance: ",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.post<StaffAttendanceDetail>(
        `/api/attendance/${id}/manual-check-out/`,
      );

      return data;
    },
    null,
  );
}
