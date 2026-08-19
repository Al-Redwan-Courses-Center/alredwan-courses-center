"use client";

import type { ReactNode } from "react";
import AuthModal from "@/components/auth/AuthModal";
import Button from "@/components/ui/Button";

export default function SignupModal({ trigger }: { trigger?: ReactNode }) {
  return (
    <AuthModal
      defaultMode="signup"
      trigger={
        trigger || (
          <Button variant="secondary" size="small" revert>
            إنشاء حساب
          </Button>
        )
      }
    />
  );
}
