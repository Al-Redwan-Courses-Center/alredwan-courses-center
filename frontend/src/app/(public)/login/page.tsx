import type { Metadata } from "next";
import { redirectAuthUser } from "@/actions/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default async function Page() {
  await redirectAuthUser();

  return <LoginForm />;
}
