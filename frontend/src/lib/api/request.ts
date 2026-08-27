import { logApiError } from "@/lib/api/errors";

export async function apiRequest<T>(
  context: string,
  request: () => Promise<T>,
  fallback: T,
  mapError?: (error: unknown) => T,
): Promise<T> {
  try {
    return await request();
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    if (mapError) {
      return mapError(error);
    }
    logApiError(context, error);
    return fallback;
  }
}
