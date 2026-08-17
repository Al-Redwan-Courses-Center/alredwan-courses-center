import { unwrapPaginated } from "@/lib/api";
import { getAuthApiClient } from "@/lib/auth-api";
import type { Instructor } from "@/types/entities/instructors";
/**
 * Fetch detailed instructor profile information.
 */
export async function getInstructorDetail(instructorId: string | number) {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get(
      `/api/users/instructors/${instructorId}/`,
    );

    return data;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error fetching instructor detail:", error);
    return null;
  }
}

/**
 * Fetch supervisor schedules for a specific instructor.
 */
export async function getSupervisorSchedules(instructorId: string | number) {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get(
      `/api/attendance/schedules/?instructor=${instructorId}`,
    );

    return data.results || data;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error fetching supervisor schedules:", error);
    return [];
  }
}

/**
 * Fetch instructor attendance history (used for the timetable/recent sessions).
 */
export async function getInstructorAttendanceHistory(
  instructorId: string | number,
) {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get(
      `/api/attendance/instructor/${instructorId}/`,
    );
    return data.results || data;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error fetching instructor attendance history:", error);
    return [];
  }
}

/**
 * Fetch list of all instructors.
 */
export async function getInstructors(): Promise<Instructor[]> {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get(
      "/api/users/instructors/?page_size=100",
    );
    return unwrapPaginated(data) as Instructor[];
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error fetching instructors:", error);
    return [];
  }
}
