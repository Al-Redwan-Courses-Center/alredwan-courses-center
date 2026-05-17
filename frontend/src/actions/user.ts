"use server";

import { apiRequest, getAuthApiClient, unwrapPaginated } from "@/lib/api";
import { PaginatedResponse } from "@/types/config";

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

      return unwrapPaginated(data);
    },
    [],
  );
}
