"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { isAxiosError } from "axios";

export interface Season {
  id: number;
  name: string;
  is_active: boolean;
}

export interface WeeklySchedule {
  id: number;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  instructor_name?: string;
  course_name?: string;
  season_name?: string;
  student_count?: number;
  type: "lecture" | "supervision";
}

export async function getSeasons() {
  try {
    const apiClient = await getAuthApiClient();
    const { data } = await apiClient.get<Season[]>("/api/courses/seasons/");
    return data;
  } catch (error) {
    console.error("Failed to fetch seasons", error);
    return [];
  }
}

export async function getAllSchedules(params?: {
  season?: number;
  instructor?: number;
  weekday?: number;
}) {
  try {
    const apiClient = await getAuthApiClient();
    
    // We fetch courses and supervisor schedules
    const [coursesRes, supervisorRes] = await Promise.all([
      apiClient.get("/api/courses/", { params }),
      apiClient.get("/api/attendance/schedules/", { params }),
    ]);

    const schedules: WeeklySchedule[] = [];

    // Process Course Schedules
    coursesRes.data.forEach((course: any) => {
      if (course.schedules) {
        course.schedules.forEach((s: any) => {
          schedules.push({
            id: s.id,
            weekday: s.weekday,
            weekday_display: s.weekday_display,
            start_time: s.start_time,
            end_time: s.end_time,
            instructor_name: course.instructor?.name,
            course_name: course.name,
            season_name: course.season?.name,
            student_count: course.enrolled_count,
            type: "lecture",
          });
        });
      }
    });

    // Process Supervisor Schedules
    supervisorRes.data.forEach((s: any) => {
      schedules.push({
        id: s.id,
        weekday: s.day_of_week,
        weekday_display: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][s.day_of_week],
        start_time: s.start_time,
        end_time: s.end_time,
        instructor_name: s.instructor_name,
        course_name: "إشراف",
        season_name: "-",
        student_count: 0,
        type: "supervision",
      });
    });

    return schedules;
  } catch (error) {
    console.error("Failed to fetch schedules", error);
    return [];
  }
}
