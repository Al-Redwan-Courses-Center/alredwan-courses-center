"use server";

import {
  getEnrollmentProgressById,
  getMyEnrollments,
} from "@/actions/enrollments";
import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import { CourseDetail, CourseListItem } from "@/types/entities";
import axios from "axios";

export async function getAllCourses(): Promise<CourseListItem[]> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<
      PaginatedResponse<CourseListItem> | CourseListItem[]
    >("/api/courses/?page_size=100");

    const enrollmentsCoursesIds = (await getMyEnrollments()).map(
      (e) => e.course,
    );

    const courses = Array.isArray(data) ? data : data.results;

    const notRegisteredCourses = courses.filter(
      (c) => !enrollmentsCoursesIds.includes(c.id),
    );

    return notRegisteredCourses;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load courses:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load courses:", error);
    }

    return [];
  }
}

export async function getInstructorCourses(
  instructorId: string | undefined,
): Promise<CourseListItem[]> {
  if (!instructorId) return [];

  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<
      PaginatedResponse<CourseListItem> | CourseListItem[]
    >(`/api/courses/?page_size=100&instructor=${instructorId}`);

    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load instructor courses:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load instructor courses:", error);
    }

    return [];
  }
}

export async function getCourseById(
  courseId: number | string,
): Promise<CourseDetail | null> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<CourseDetail>(
      `/api/courses/${courseId}/`,
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load course details:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load course details:", error);
    }

    return null;
  }
}

export async function getStudentCourses() {
  try {
    const myEnrollments = await getMyEnrollments();

    const myCoursesInitial = await Promise.all(
      myEnrollments.map((e) => getCourseById(e.course)),
    );
    const myEnrollmentsProgresses = await Promise.all(
      myEnrollments.map((e) => getEnrollmentProgressById(e.id)),
    );

    const myCourses = myCoursesInitial.map((c, i) => ({
      ...c,
      course_progress: myEnrollmentsProgresses[i]?.percentage,
    }));

    return myCourses;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to load instructor courses:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load instructor courses:", error);
    }

    return [];
  }
}
