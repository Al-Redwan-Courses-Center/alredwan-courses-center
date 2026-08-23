import type { PaginatedResponse } from "@/types/config";

export function unwrapPaginated<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}
