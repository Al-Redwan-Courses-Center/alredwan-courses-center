import { redirectAuthUser } from "@/actions/auth";
import LoginForm from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default async function Page() {
  await redirectAuthUser();

  return <LoginForm />;
}
