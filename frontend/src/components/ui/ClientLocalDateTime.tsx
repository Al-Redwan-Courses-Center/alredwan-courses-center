"use client";

import { parseISO } from "date-fns";
import type { ReactNode } from "react";
import { useIsClient } from "usehooks-ts";
import { formatDate, formatTime } from "@/lib/utils";

export default function ClientLocalDateTime({
  iso,
  fallback = "-",
}: {
  iso: string | null | undefined;
  fallback?: ReactNode;
}) {
  const isClient = useIsClient();

  if (!iso || !isClient) return <>{fallback}</>;

  const date = parseISO(iso);

  return (
    <>
      {formatDate(date)} - {formatTime(date)}
    </>
  );
}
