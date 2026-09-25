import { unstable_rethrow } from "next/navigation";
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
    unstable_rethrow(error);

    if (mapError) {
      return mapError(error);
    }

    logApiError(context, error);
    return fallback;
  }
}
