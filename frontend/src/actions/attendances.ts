"use server";

import { apiRequest, getAuthApiClient } from "@/lib/api";
import {
  BulkLectureAttendanceBody,
  BulkLectureAttendanceResponse,
  LectureAttendanceDetailsResponse,
} from "@/types/entities";

export async function getLectureAttendance(lectureId: string) {
  return apiRequest(
    "Failed to get lecture attendances: ",
    async () => {
      const apiClient = await getAuthApiClient();
      const { data } = await apiClient.get<LectureAttendanceDetailsResponse>(
        `/api/attendance/lecture/${lectureId}/details/`,
      );

      return data;
    },
    null,
  );
}

export async function markLectureAttendanceInBulk(
  lectureId: string,
  body: BulkLectureAttendanceBody,
) {
  return apiRequest(
    "Failed to mark lecture attendances in bulk: ",
    async () => {
      const apiClient = await getAuthApiClient();
      const res = await apiClient.post<BulkLectureAttendanceResponse>(
        `/api/attendance/lecture/${lectureId}/mark-bulk/`,
        body,
      );

      return res.data;
    },
    null,
  );
}
