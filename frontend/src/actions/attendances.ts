"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import {
  BulkLectureAttendanceBody,
  BulkLectureAttendanceResponse,
  LectureAttendanceDetailsResponse,
} from "@/types/entities";
import { isAxiosError } from "axios";

export async function getLectureAttendance(lectureId: string) {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<LectureAttendanceDetailsResponse>(
      `/api/attendance/lecture/${lectureId}/details/`,
    );

    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to get lecture attendances: ",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to get lecture attendances: ", error);
    }

    return null;
  }
}

export async function markLectureAttendanceInBulk(
  lectureId: string,
  body: BulkLectureAttendanceBody,
) {
  try {
    const apiClient = await getAuthApiClient();
    const res = await apiClient.post<BulkLectureAttendanceResponse>(
      `/api/attendance/lecture/${lectureId}/mark-bulk/`,
      body,
    );

    return res.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to mark lecture attendances in bulk: ",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to mark lecture attendances in bulk: ", error);
    }

    return null;
  }
}
