"use client";

import { formatDate, formatTime } from "@/lib/utils";
import { parseISO } from "date-fns";
import { ReactNode } from "react";
import { useIsClient } from "usehooks-ts";

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
