"use client";

import Button from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import FieldSetInput from "@/components/ui/FieldSetInput";
import { LoginInputs } from "@/types/auth";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function LoginForm({
  callbackUrl,
  onSwitchToSignup,
  onLoadingChange,
}: {
  callbackUrl?: string | null;
  onSwitchToSignup?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [countryCode, setCountryCode] = useState("20");
  const [showCountryCodeList, setShowCountryCodeList] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginInputs>({
    defaultValues: {
      phone_number1: "01000000000",
      password: "password123",
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    onLoadingChange?.(isSubmitting);
  }, [isSubmitting, onLoadingChange]);

  const onSubmit: SubmitHandler<LoginInputs> = async (credentials) => {
    const res = await signIn("credentials", {
      redirect: false,
      ...credentials,
    });

    if (res?.ok) {
      // if (pathname === "/") {
      toast.success("السلام عليكم و رحمة الله و بركاته");
      // router.refresh();
      // } else
      window.location.replace(callbackUrl || "/dashboard");

      return;
    }

    let errMssg = "";

    switch (res?.status) {
      case 401: {
        errMssg = "بياناتك خاطئة!\nمن فضلك أدخل بيانات صحيحة";
        break;
      }

      default: {
        errMssg = "حدث خطأ أثناء تسجيل الدخول!\nحاول مرة أخرى!";
      }
    }

    toast.error(errMssg);
  };

  return (
    <form
      onSubmit={handleSubmit((credentials) =>
        onSubmit({
          ...credentials,
          phone_number1: `+${countryCode + credentials.phone_number1.slice(1)}`,
        }),
      )}
      className="flex flex-col gap-20 text-3xl [&>input]:bg-gray-300"
    >
      <div className="flex flex-col gap-10">
        <FieldSetInput
          label="رقم الهاتف"
          placeholder="01234567890"
          button={
            <DropdownMenu
              open={showCountryCodeList}
              onOpenChange={setShowCountryCodeList}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="relative -top-2 rounded-lg p-2 transition-colors hover:bg-gray-300"
                  dir="ltr"
                >
                  +{countryCode}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="relative z-1000 w-fit min-w-0 bg-gray-100 px-5">
                <ul className="w-fit text-center text-3xl [direction:ltr] [&>li]:w-full [&>li]:py-5 [&>li]:not-last:border-b">
                  <li>
                    <button
                      onClick={() => {
                        setCountryCode("20");
                        setShowCountryCodeList(false);
                      }}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-300"
                    >
                      +20
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setCountryCode("1");
                        setShowCountryCodeList(false);
                      }}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-300"
                    >
                      +1
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setCountryCode("44");
                        setShowCountryCodeList(false);
                      }}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-300"
                    >
                      +44
                    </button>
                  </li>
                </ul>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          registerReturn={register("phone_number1")}
        />

        <FieldSetInput
          type={showPassword ? "text" : "password"}
          label="كلمة المرور"
          button={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-olive-500"
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          }
          registerReturn={register("password")}
        />
      </div>

      <div className="flex flex-col gap-5">
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="h-20"
        >
          تسجيل الدخول
        </Button>

        <Link
          href="/forgot-password"
          className="text-olive-900 hover:text-olive-300 self-center text-2xl font-bold underline transition-colors"
        >
          نسيت كلمة المرور؟
        </Link>

        <div className="flex flex-col">
          <span className="self-center text-2xl">ليس لديك حساب؟</span>
          <button
            type="button"
            onClick={() => onSwitchToSignup?.()}
            className="text-olive-900 hover:text-olive-300 self-center text-2xl font-bold underline transition-colors"
          >
            سجل حساب جديد الآن
          </button>
        </div>
      </div>
    </form>
  );
}
