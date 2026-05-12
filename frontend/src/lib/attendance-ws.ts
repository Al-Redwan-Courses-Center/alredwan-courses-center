/**
 * Base URL for the attendance ASGI WebSocket server (no path, no trailing slash).
 * Example: ws://localhost:8001 or wss://api.example.com:8001
 */
export function getAttendanceWebSocketBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_ATTENDANCE_WS_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "ws://localhost:8001";
}

export function buildAttendanceWebSocketUrl(ticket: string): string {
  const base = getAttendanceWebSocketBaseUrl();
  const q = new URLSearchParams({ ticket });
  return `${base}/ws/attendance/?${q.toString()}`;
}
