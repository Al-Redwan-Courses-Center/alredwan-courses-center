"use client";

import { formatDate, formatTime } from "@/lib/utils";
import { parseISO } from "date-fns";

export default function ClientLocalDateTime({ iso }: { iso: string }) {
  const date = parseISO(iso);

  return (
    <>
      {formatDate(date)} - {formatTime(date)}
    </>
  );
}
