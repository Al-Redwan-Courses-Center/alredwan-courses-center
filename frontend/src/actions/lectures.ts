import { getServerJwtToken } from "@/actions/auth";
import { getInstructorCourses } from "@/actions/courses";
import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import { LectureListItem } from "@/types/entities";
import { isAxiosError } from "axios";

export async function getLecturesByCourseId(courseId: string) {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<PaginatedResponse<LectureListItem>>(
      `/courses/${courseId}/lectures/?page_size=100`,
    );

    console.log(data);

    const lectures = Array.isArray(data) ? data : data.results;

    return lectures;
  } catch (err) {
    if (isAxiosError(err)) {
      console.error(
        "Failed to get lectures: ",
        err.response?.data ?? err.message,
      );
    } else {
      console.error("Failed to get lectures: ", err);
    }

    return [];
  }
}

export async function getInstructorTodaysLectures() {
  try {
    const { id, ...rest } = (await getServerJwtToken()) || {};

    if (!id) return [];
    console.log(rest);

    const coursesIds = (await getInstructorCourses(id)).map((c) => c.id);

    const lectures = await Promise.all(
      coursesIds.map((id) => getLecturesByCourseId(String(id))),
    );
  } catch (err) {
    if (isAxiosError(err)) {
      console.error(
        "Failed to get today's lectures: ",
        err.response?.data ?? err.message,
      );
    } else {
      console.error("Failed to get today's lectures: ", err);
    }

    return [];
  }
}
