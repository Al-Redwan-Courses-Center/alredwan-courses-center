"use server";

import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import { isAxiosError } from "axios";

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
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<
      PaginatedResponse<ParentChildDetail> | ParentChildDetail[]
    >("/api/parents/children/?page_size=100");

    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "Failed to load parent's children:",
        error.response?.data ?? error.message,
      );
    } else {
      console.error("Failed to load parent's children:", error);
    }

    return [];
  }
}

export async function addChild(data: {
  first_name: string;
  last_name: string;
  dob: string;
  gender: "boy" | "girl";
}) {
  try {
    const apiClient = await getAuthApiClient();
    const response = await apiClient.post("/api/parents/children/create/", data);
    return { data: response.data, error: null };
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        data: null,
        error: error.response?.data ?? "حدث خطأ أثناء إضافة الطفل",
      };
    }
    return { data: null, error: "حدث خطأ غير متوقع" };
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
