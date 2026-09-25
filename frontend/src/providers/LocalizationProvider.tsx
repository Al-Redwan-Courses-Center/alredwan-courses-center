"use client";

import { LocalizationProvider as LocaleProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { ReactNode } from "react";

export default function LocalizationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LocaleProvider dateAdapter={AdapterDateFns}>{children}</LocaleProvider>
  );
}
