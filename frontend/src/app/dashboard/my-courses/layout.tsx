import type { ReactNode } from "react";
import { protect } from "@/actions/auth";

export default async function Layout({ children }: { children: ReactNode }) {
  await protect(["instructor", "student"]);

  return children;
}
