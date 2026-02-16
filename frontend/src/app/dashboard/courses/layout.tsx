import { protect } from "@/actions/auth";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  await protect(["parent", "student"]);

  return children;
}
