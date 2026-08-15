import { protect } from "@/actions/auth";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  await protect(["instructor", "student", "parent"]);

  return children;
}
