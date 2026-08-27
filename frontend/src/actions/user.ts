"use server";

import { isAxiosError } from "axios";
import { revalidatePath } from "next/cache";
import { getCourseById } from "@/actions/courses";
import { getEnrollmentProgressById } from "@/actions/enrollments";
import { apiRequest, getAuthApiClient, unwrapPaginated } from "@/lib/api";
import type { PaginatedResponse } from "@/types/config";
import type {
  CourseDetail,
  EnrollmentListItem,
  EnrollmentRequestListItem,
  OnlineCourseDetail,
  StudentCourseItem,
  VideoLectureItem,
} from "@/types/entities";
import type { InstructorDetail } from "@/types/entities/instructors";

export interface ParentChildDetail {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  dob: string;
  age: number;
  gender: "girl" | "boy";
  image: string | null;
  unique_code: string;
  primary_parent_name: string;
  created_at: string;
  updated_at: string;
}

export async function getParentChildren(): Promise<ParentChildDetail[]> {
  return apiRequest(
    "Failed to load parent's children:",
    async () => {
      const apiClient = await getAuthApiClient();

      const { data } = await apiClient.get<
        PaginatedResponse<ParentChildDetail> | ParentChildDetail[]
      >("/api/parents/children/?page_size=100");

      const childrenList = unwrapPaginated(data);
      return childrenList.sort((a, b) => b.age - a.age);
    },
    [],
  );
}

export async function addChild(data: {
  first_name: string;
  last_name: string;
  dob: string;
  gender: "boy" | "girl";
}) {
  try {
    const apiClient = await getAuthApiClient();
    const response = await apiClient.post(
      "/api/parents/children/create/",
      data,
    );
    revalidatePath("/dashboard/my-children");
    return { data: response.data, error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (isAxiosError(error)) {
      return {
        data: null,
        error: error.response?.data ?? "حدث خطأ أثناء إضافة الطفل",
      };
    }
    return { data: null, error: "حدث خطأ غير متوقع" };
  }
}

export async function updateChild(
  id: string,
  data: {
    first_name: string;
    last_name: string;
    dob: string;
    gender: "boy" | "girl";
  },
) {
  try {
    const apiClient = await getAuthApiClient();
    const response = await apiClient.patch(
      `/api/parents/children/${id}/update/`,
      data,
    );
    revalidatePath("/dashboard/my-children");
    return { data: response.data, error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (isAxiosError(error)) {
      return {
        data: null,
        error: error.response?.data ?? "حدث خطأ أثناء تحديث بيانات الطفل",
      };
    }
    return { data: null, error: "حدث خطأ غير متوقع" };
  }
}

export async function deleteChild(id: string) {
  try {
    const apiClient = await getAuthApiClient();
    await apiClient.delete(`/api/parents/children/${id}/delete/`);
    return { error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (isAxiosError(error)) {
      return {
        error: error.response?.data ?? "حدث خطأ أثناء حذف الطفل",
      };
    }
    return { error: "حدث خطأ غير متوقع" };
  }
}

export async function getChildById(
  id: string,
): Promise<ParentChildDetail | null> {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<ParentChildDetail>(
      `/api/parents/children/${id}/`,
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
    console.error("Failed to fetch child details:", error);
    return null;
  }
}

export async function getChildEnrollments(
  childId: string,
): Promise<EnrollmentListItem[]> {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<
      PaginatedResponse<EnrollmentListItem> | EnrollmentListItem[]
    >(`/api/enrollments/my-enrollments/?child=${childId}&page_size=100`);

    const results = Array.isArray(data) ? data : data.results;
    return results;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to load child enrollments:", error);
    return [];
  }
}

export async function getChildEnrollmentRequests(
  childId: string,
): Promise<EnrollmentRequestListItem[]> {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<
      PaginatedResponse<EnrollmentRequestListItem> | EnrollmentRequestListItem[]
    >(`/api/enrollment-requests/my-requests/?child=${childId}&page_size=100`);

    const results = Array.isArray(data) ? data : data.results;
    return results;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to load child enrollment requests:", error);
    return [];
  }
}

export async function getChildCourses(childId: string): Promise<StudentCourseItem[]> {
  try {
    const myEnrollments = await getChildEnrollments(childId);
    const myRequests = await getChildEnrollmentRequests(childId);

    const pendingRequests = myRequests.filter(
      (r) => r.status === "pending" || r.status === "processing"
    );

    const physicalEnrollments = myEnrollments.filter((e) => e.course !== null);
    const onlineEnrollments = myEnrollments.filter((e) => e.online_course !== null);

    const physicalRequests = pendingRequests.filter((r) => r.course !== null);
    const onlineRequests = pendingRequests.filter((r) => r.online_course !== null);

    const getUniqueIds = <T, K extends keyof T>(
      arr: T[],
      key: K,
    ): NonNullable<T[K]>[] =>
      Array.from(
        new Set(
          arr
            .map((item) => item[key])
            .filter((val): val is NonNullable<T[K]> => val !== null && val !== undefined),
        ),
      );

    const physicalCourseIds = getUniqueIds(
      [...physicalEnrollments, ...physicalRequests],
      "course",
    );
    const onlineCourseIds = getUniqueIds(
      [...onlineEnrollments, ...onlineRequests],
      "online_course",
    );

    const [myCoursesInitial, myEnrollmentsProgresses] = await Promise.all([
      Promise.all(physicalCourseIds.map((id) => getCourseById(id as number))),
      Promise.all(physicalEnrollments.map((e) => getEnrollmentProgressById(e.id))),
    ]);

    const physical = myCoursesInitial
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => {
        const isPending = !physicalEnrollments.find((e) => e.course === c?.id);
        const req = physicalRequests.find((r) => r.course === c?.id);
        const activeIndex = physicalEnrollments.findIndex((e) => e.course === c?.id);

        return {
          ...c,
          course_progress: isPending ? 0 : myEnrollmentsProgresses[activeIndex]?.percentage || 0,
          type: "physical" as const,
          enrollment_status: isPending ? req?.status : "active",
          enrollment_status_display: isPending ? req?.status_display : "نشط",
        };
      });

    const apiClient = await getAuthApiClient();
    let onlineCoursesInitial: OnlineCourseDetail[] = [];
    if (onlineCourseIds.length > 0) {
      const res = await apiClient
        .get<OnlineCourseDetail[]>(`/api/online-courses/courses/batch/`, {
          params: { ids: onlineCourseIds.join(","), child: childId },
        })
        .catch(() => ({ data: [] }));
      onlineCoursesInitial = res.data;
    }

    const online = onlineCoursesInitial
      .filter((c): c is OnlineCourseDetail => c !== null)
      .map((c: OnlineCourseDetail) => {
        const isPending = !onlineEnrollments.find((e) => e.online_course === c?.id);
        const req = onlineRequests.find((r) => r.online_course === c?.id);

        const completedLecturesCount =
          c.video_lectures?.filter((l: VideoLectureItem) => l.watch_progress?.is_completed).length || 0;
        const progressPercentage =
          c.video_lectures && c.video_lectures.length > 0
            ? Math.round((completedLecturesCount / c.video_lectures.length) * 100)
            : 0;

        return {
          ...c,
          course_progress: progressPercentage,
          type: "online" as const,
          enrollment_status: isPending ? req?.status : "active",
          enrollment_status_display: isPending ? req?.status_display : "نشط",
        };
      });

    return [...physical, ...online];
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to load child courses:", error);
    return [];
  }
}

// export async function getInstructorId(phoneNum: string) {
//   try {
//     const formattedPhoneNum = phoneNum.replaceAll(/\D/g, "");

//     const apiClient = await getAuthApiClient();
//     const { data } = await apiClient.get<PaginatedResponse<Instructor>>(
//       `/api/users/instructors/?user__phone_number1__icontains=${formattedPhoneNum}`,
//     );

//     const instructorId = String(data.results[0].id);

//     return instructorId;
//   } catch (err) {
//     if (isAxiosError(err)) {
//       console.error(
//         "Failed to get the instructor: ",
//         err.response?.data ?? err.message,
//       );
//     } else {
//       console.error("Failed to get today's lectures: ", err);
//     }

//     return null;
//   }
// }
export async function getInstructorById(id: string | number): Promise<InstructorDetail | null> {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<InstructorDetail>(`/api/users/instructors/${id}/`);
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
    console.error("Failed to fetch instructor details:", error);
    return null;
  }
}
