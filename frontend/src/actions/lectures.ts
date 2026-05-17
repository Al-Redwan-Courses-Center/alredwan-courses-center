"use server";

import { apiRequest, getAuthApiClient, unwrapPaginated } from "@/lib/api";
import { PaginatedResponse, TodaysLecturesResponse } from "@/types/config";
import { LectureDetail, LectureListItem } from "@/types/entities";

export async function getLecturesByCourseId(courseId: string) {
  return apiRequest(
    "Failed to get lectures: ",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<LectureListItem> | LectureListItem[]
      >(`/api/courses/${courseId}/lectures/?page_size=100`);

      return unwrapPaginated(data);
    },
    [],
  );
}

export async function getLectureById(lectureId: string) {
  return apiRequest(
    "Failed to get lecture: ",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<LectureDetail>(
        `/api/courses/lectures/${lectureId}/`,
      );

      return data;
    },
    null,
  );
}

export async function getInstructorTodaysLectures() {
  return apiRequest(
    "Failed to get today's lectures: ",
    async () => {
      const apiClient = await getAuthApiClient();
      const { data } = await apiClient.get<TodaysLecturesResponse>(
        "/api/courses/lectures/today/",
      );

      return data;
    },
    null,
  );
}
