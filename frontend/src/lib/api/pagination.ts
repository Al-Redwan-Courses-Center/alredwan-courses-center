import type { PaginatedResponse } from "@/types/config";

export function unwrapPaginated<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export function toPaginatedResponse<T>(
  data: PaginatedResponse<T> | T[],
  fallbackPageSize: number = 10,
): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      total_pages: Math.ceil(data.length / fallbackPageSize) || 1,
      current_page: 1,
      page_size: fallbackPageSize,
      results: data,
    };
  }
  return data;
}
