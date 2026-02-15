"use client";

import AuthModal from "@/components/auth/AuthModal";
import Button from "@/components/ui/Button";
import { ReactNode } from "react";

export default function SignupModal({ trigger }: { trigger?: ReactNode }) {
  return (
    <AuthModal
      defaultMode="signup"
      trigger={
        trigger || (
          <Button variant="secondary" size="small">
            إنشاء حساب
          </Button>
        )
      }
    />
  );
}
