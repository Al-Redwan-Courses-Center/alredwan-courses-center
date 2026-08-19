"use client";

import { parseISO } from "date-fns";
import { useIsClient } from "usehooks-ts";
import { formatTime } from "@/lib/utils";

function ClientLocalTime({
  iso,
  fallback = "-",
}: {
  iso: string | null | undefined;
  fallback?: string;
}) {
  const isClient = useIsClient();

  if (!iso || !isClient) return <>{fallback}</>;

  const date = parseISO(iso);

  return <>{formatTime(date)}</>;
}

export default ClientLocalTime;
