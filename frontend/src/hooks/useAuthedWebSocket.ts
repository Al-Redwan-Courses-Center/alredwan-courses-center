import { useState, useEffect, useCallback } from "react";
import useWebSocket from "react-use-websocket";
import { getWebSocketTicket } from "@/actions/auth";

export default function useAuthedWebSocket<T>(
  baseUrl: string,
  options: Parameters<typeof useWebSocket>[1] = {},
) {
  const {
    shouldReconnect,
    reconnectAttempts = 10,
    reconnectInterval = 10000,
  } = options;
  const [authedUrl, setAuthedUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [ticketKey, setTicketKey] = useState(0);
  const [prevBaseUrl, setPrevBaseUrl] = useState(baseUrl);

  if (baseUrl !== prevBaseUrl) {
    setPrevBaseUrl(baseUrl);
    setAuthedUrl(null);
    setAuthError(null);
  }

  useEffect(() => {
    let isMounted = true;
    getWebSocketTicket()
      .then((token) => {
        if (!isMounted) return;
        if (token) {
          const validUrl = new URL(baseUrl, window.location.origin);
          validUrl.searchParams.set("ticket", token);
          setAuthedUrl(validUrl.toString());
          setAuthError(null);
        } else {
          setAuthError(new Error("Unauthenticated"));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setAuthError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    return () => {
      isMounted = false;
    };
  }, [baseUrl, ticketKey]);

  const handleShouldReconnect = useCallback(
    (closeEvent: CloseEvent) => {
      if (shouldReconnect && !shouldReconnect(closeEvent)) {
        return false;
      }
      if (closeEvent.code === 1000) return false;
      setTicketKey((prev) => prev + 1);
      return true;
    },
    [shouldReconnect],
  );

  const webSocketResult = useWebSocket<T>(authedUrl, {
    ...options,
    shouldReconnect: handleShouldReconnect,
    reconnectAttempts,
    reconnectInterval,
  });

  return {
    ...webSocketResult,
    authError,
    isLoadingToken: !authedUrl && !authError,
  };
}
