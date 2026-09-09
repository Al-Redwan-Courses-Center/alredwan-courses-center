import type { ReactNode } from "react";
import { protect } from "@/actions/auth";

export default async function Layout({ children }: { children: ReactNode }) {
  await protect(["parent", "student", "admin", "instructor", "supervisor"]);

  return children;
}
