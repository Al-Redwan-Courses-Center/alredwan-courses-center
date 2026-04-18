"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse, TodaysLecturesResponse } from "@/types/config";
import { LectureDetail, LectureListItem } from "@/types/entities";
import { isAxiosError } from "axios";

export async function getLecturesByCourseId(courseId: string) {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<PaginatedResponse<LectureListItem>>(
      `/api/courses/${courseId}/lectures/?page_size=100`,
    );

    const lectures = Array.isArray(data)
      ? (data as LectureListItem[])
      : data.results;

    return lectures;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to get lectures: ",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to get lectures: ", error);
    }

    return [];
  }
}

export async function getLectureById(lectureId: string) {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<LectureDetail>(
      `/api/courses/lectures/${lectureId}/`,
    );

    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to get lecture: ",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to get lecture: ", error);
    }

    return null;
  }
}

export async function getInstructorTodaysLectures() {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<TodaysLecturesResponse>(
      "/api/courses/lectures/today/",
    );

    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to get today's lectures: ",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to get today's lectures: ", error);
    }

    return null;
  }
}
