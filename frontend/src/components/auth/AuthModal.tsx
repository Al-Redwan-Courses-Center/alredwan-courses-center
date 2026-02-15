"use client";

import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
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
import { ReactNode, Suspense, useEffect, useState } from "react";
import Logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

function PreAuthModal({
  trigger,
  defaultMode = "login",
}: {
  trigger?: ReactNode;
  defaultMode?: AuthMode;
}) {
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const [isMobile, setIsMobile] = useState(false);

  const [callbackUrl] = useState(searchParams.get("callbackUrl"));
  const [isOpen, setIsOpen] = useState(searchParams.get("login") === "true");
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("login") === "true" ? "login" : defaultMode,
  );

  useEffect(() => {
    if (isOpen || callbackUrl)
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setMode(defaultMode);
      }}
    >
      <ModalTrigger asChild>
        {trigger ? (
          trigger
        ) : isMobile ? (
          <button className="text-olive-500 relative flex h-full flex-col items-center text-center text-[1.4rem] leading-normal font-normal transition-all">
            <Image src={Logo} alt="Logo" className="h-auto w-10" />
            <span className="whitespace-nowrap">تسجيل الدخول</span>
          </button>
        ) : (
          <Button variant="primary" size="small">
            تسجيل دخول
          </Button>
        )}
      </ModalTrigger>

      <ModalContent
        className={cn(
          mode === "login" ? "max-w-1/4" : "mobile-lg:max-h-9/10 max-w-1/2",
          "tablet:max-w-8/10 max-h-7/10",
        )}
      >
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
              <span>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</span>
            </div>
          </div>
        </ModalTitle>

        {mode === "login" ? (
          <LoginForm
            callbackUrl={callbackUrl}
            onSwitchToSignup={() => setMode("signup")}
          />
        ) : (
          <div className="flex max-h-full w-full flex-col items-center overflow-auto">
            <SignupForm />
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-olive-900 hover:text-olive-300 mt-6 text-2xl font-bold underline transition-colors"
            >
              لديك حساب بالفعل؟ سجل دخولك
            </button>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

export default function AuthModal({
  trigger,
  defaultMode,
}: {
  trigger?: ReactNode;
  defaultMode?: AuthMode;
}) {
  return (
    <Suspense fallback={null}>
      <PreAuthModal trigger={trigger} defaultMode={defaultMode} />
    </Suspense>
  );
}
