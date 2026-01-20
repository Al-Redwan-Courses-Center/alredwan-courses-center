"use client";

import LoginForm from "@/components/auth/LoginForm";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { Suspense, useEffect, useState } from "react";

function PreLoginModal() {
  const { searchParams, mutateSearchParams } = useMutateSearchParams();

  const [callbackUrl] = useState(searchParams.get("callbackUrl"));
  const [login, setLogin] = useState(searchParams.get("login") === "true");

  useEffect(() => {
    if (login || callbackUrl)
      mutateSearchParams(
        [
          {
            key: "login",
            val: "",
          },
          {
            key: "callbackUrl",
            val: "",
          },
        ],
        true,
      );
  }, []);

  return (
    <Modal
      open={login}
      onOpenChange={(open) => {
        setLogin(open);
      }}
    >
      <ModalTrigger asChild>
        <Button variant="primary" size="small">
          تسجيل دخول
        </Button>
      </ModalTrigger>

      <ModalContent className="max-h-7/10 max-w-1/2">
        <ModalTitle>تسجيل الدخول</ModalTitle>
        <LoginForm callbackUrl={callbackUrl} />
      </ModalContent>
    </Modal>
  );
}

export default function LoginModal() {
  return (
    <Suspense fallback={null}>
      <PreLoginModal />
    </Suspense>
  );
}
