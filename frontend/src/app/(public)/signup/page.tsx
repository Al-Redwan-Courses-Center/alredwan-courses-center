import type { Metadata } from "next";
import { redirectAuthUser } from "@/actions/auth";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "تسجيل جديد",
};

export default async function Page() {
  await redirectAuthUser();

  return <SignupForm />;
}
