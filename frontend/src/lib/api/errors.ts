import { isAxiosError } from "axios";

export function logApiError(context: string, error: unknown): void {
  if (isAxiosError(error)) {
    console.error(context, error.response?.data ?? error.message);
    return;
  }

  console.error(context, error);
}

type ApiErrorPayload = Record<string, string[] | string>;

function normalizeFieldErrors(value: unknown): string[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeFieldErrors(item));
  }

  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (typeof value === "object") {
    return [JSON.stringify(value)];
  }

  return [String(value)];
}

export function parseApiFieldErrors(
  error: unknown,
): Record<string, string[]> | undefined {
  if (!isAxiosError(error)) return undefined;

  const responseData = error.response?.data as ApiErrorPayload | undefined;

  if (!responseData || Array.isArray(responseData)) return undefined;

  return Object.fromEntries(
    Object.entries(responseData).map(([key, value]) => [
      key,
      normalizeFieldErrors(value),
    ]),
  );
}

export function getApiErrorDetail(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;

  const responseData = error.response?.data as ApiErrorPayload | undefined;
  const detail = responseData?.detail;

  return Array.isArray(detail) ? detail[0] : detail;
}
