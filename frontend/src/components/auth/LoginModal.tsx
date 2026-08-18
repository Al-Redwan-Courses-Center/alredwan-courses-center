"use client";

import LoginForm from "@/components/auth/LoginForm";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import Logo from "@/assets/logo.svg";

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

      <ModalContent className="max-h-7/10 max-w-1/4">
        <ModalTitle>
          <div className="flex flex-col items-start gap-10">
            <Image
              src={Logo}
              alt="Logo Illustration"
              className="h-auto w-30 self-center"
              draggable={false}
            />

            <div className="flex flex-col gap-2 text-start">
              <ModalDescription>
                أهلاً بك في واحة الرضوان التعليمية
              </ModalDescription>
              <span>تسجيل الدخول</span>
            </div>
          </div>
        </ModalTitle>

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
