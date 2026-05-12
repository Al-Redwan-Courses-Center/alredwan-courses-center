/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { requestAttendanceWsTicket } from "@/actions/admin-attendances";
import { buildAttendanceWebSocketUrl } from "@/lib/attendance-ws";
import type {
  StaffAttendanceClientEvent,
  StaffAttendanceServerEvent,
} from "@/types/entities/staff-attendance-events";
import { useCallback, useEffect, useRef, useState } from "react";

const WS_FATAL_CLOSE_CODES = new Set([4001, 4002, 4003]);

const DEFAULT_MAX_RECONNECT = 5;
const DEFAULT_RECONNECT_MS = 3000;

export type StaffAttendanceWsReadyState =
  | "idle"
  | "connecting"
  | "open"
  | "closed";

export function useStaffAttendanceWebSocket(enabled: boolean) {
  const [lastJsonMessage, setLastJsonMessage] =
    useState<StaffAttendanceServerEvent | null>(null);
  const [readyState, setReadyState] =
    useState<StaffAttendanceWsReadyState>("idle");
  const [fatalCloseCode, setFatalCloseCode] = useState<number | null>(null);
  const [reconnectExhausted, setReconnectExhausted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  const sendJsonMessage = useCallback((msg: StaffAttendanceClientEvent) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;

    if (!enabled) {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      setReadyState("idle");
      setReconnectExhausted(false);
      setFatalCloseCode(null);
      return;
    }

    const maxAttempts = DEFAULT_MAX_RECONNECT;
    const reconnectDelay = DEFAULT_RECONNECT_MS;

    const scheduleReconnect = () => {
      if (cancelled.current) return;
      if (reconnectAttempts.current >= maxAttempts) {
        setReadyState("closed");
        setReconnectExhausted(true);
        return;
      }
      reconnectAttempts.current += 1;
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, reconnectDelay);
    };

    async function connect() {
      if (cancelled.current) return;

      setReadyState("connecting");
      setFatalCloseCode(null);

      const ticketPayload = await requestAttendanceWsTicket();
      if (cancelled.current) return;

      if (!ticketPayload?.ticket) {
        setReadyState("closed");
        scheduleReconnect();
        return;
      }

      const url = buildAttendanceWebSocketUrl(ticketPayload.ticket);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled.current) {
          ws.close();
          return;
        }
        reconnectAttempts.current = 0;
        setReconnectExhausted(false);
        setReadyState("open");
        ws.send(
          JSON.stringify({
            type: "request_summary",
          } satisfies StaffAttendanceClientEvent),
        );
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(
            event.data as string,
          ) as StaffAttendanceServerEvent;
          setLastJsonMessage(parsed);
        } catch {
          // Malformed JSON from the socket; ignore.
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        if (cancelled.current) return;

        if (WS_FATAL_CLOSE_CODES.has(event.code)) {
          setFatalCloseCode(event.code);
          setReadyState("closed");
          return;
        }

        setReadyState("closed");
        scheduleReconnect();
      };

      ws.onerror = () => {
        // Browser surfaces details in the subsequent `close` event.
      };
    }

    connect();

    return () => {
      cancelled.current = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      setReadyState("idle");
    };
  }, [enabled]);

  return {
    lastJsonMessage,
    sendJsonMessage,
    readyState,
    fatalCloseCode,
    reconnectExhausted,
  };
}
