import { isAxiosError } from "axios";

export function logApiError(context: string, error: unknown): void {
  if (isAxiosError(error)) {
    console.error(context, error.response?.data ?? error.message);
    return;
  }

  console.error(context, error);
}

type ApiErrorPayload = Record<string, string[] | string> | { detail?: string | string[] };

export function parseApiFieldErrors(
  error: unknown,
): Record<string, string[]> | undefined {
  if (!isAxiosError(error)) return undefined;

  const responseData = error.response?.data as ApiErrorPayload | undefined;

  if (!responseData || Array.isArray(responseData)) return undefined;

  return Object.fromEntries(
    Object.entries(responseData).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : [String(value)],
    ]),
  );
}

export function getApiErrorDetail(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;

  const responseData = error.response?.data as ApiErrorPayload | undefined;
  const detail = responseData?.detail;

  return Array.isArray(detail) ? detail[0] : detail;
}
