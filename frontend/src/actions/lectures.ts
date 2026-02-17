import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import { LectureListItem } from "@/types/entities";
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

// export async function getInstructorTodaysLectures() {
//   try {
//     const { id, ...rest } = (await getServerJwtToken()) || {};

//     if (!id) return [];
//     console.log(rest);

//     const coursesIds = (await getInstructorCourses(id)).map((c) => c.id);

//     const lectures = await Promise.all(
//       coursesIds.map((id) => getLecturesByCourseId(String(id))),
//     );
//   } catch (err) {
//     if (isAxiosError(err)) {
//       console.error(
//         "Failed to get today's lectures: ",
//         err.response?.data ?? err.message,
//       );
//     } else {
//       console.error("Failed to get today's lectures: ", err);
//     }

//     return [];
//   }
// }
