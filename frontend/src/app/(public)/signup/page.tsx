import { redirectAuthUser } from "@/actions/auth";
import SignupForm from "@/components/auth/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل جديد",
};

export default async function Page() {
  await redirectAuthUser();

  return <SignupForm />;
}
