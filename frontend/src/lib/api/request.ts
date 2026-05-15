import { logApiError } from "@/lib/api/errors";

export async function apiRequest<T>(
  context: string,
  request: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    logApiError(context, error);
    return fallback;
  }
}
