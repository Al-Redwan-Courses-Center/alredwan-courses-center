import { logApiError } from "@/lib/api/errors";

export async function apiRequest<T>(
  context: string,
  request: () => Promise<T>,
  fallback: T,
  mapError?: (error: unknown) => T,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.log(JSON.stringify(error, null, 2));
    if (mapError) {
      return mapError(error);
    }
    logApiError(context, error);
    return fallback;
  }
}
