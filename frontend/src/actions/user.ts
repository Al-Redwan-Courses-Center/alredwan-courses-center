import { getAuthApiClient } from "@/lib/auth-api";
import { PaginatedResponse } from "@/types/config";
import { isAxiosError } from "axios";

export interface ParentChildOption {
  id: string;
  first_name: string;
  last_name: string;
  unique_code: string;
}

export async function getParentChildren(): Promise<ParentChildOption[]> {
  try {
    const apiClient = await getAuthApiClient();

    const { data } = await apiClient.get<
      PaginatedResponse<ParentChildOption> | ParentChildOption[]
    >("/api/children/?page_size=100");

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
