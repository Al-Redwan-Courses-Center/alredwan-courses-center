"use client";

import Button from "@/components/ui/Button";
import FieldSetInput from "@/components/ui/FieldSetInput";
import { LoginInputs } from "@/types/auth";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function LoginForm({
  callbackUrl,
}: {
  callbackUrl?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { register, handleSubmit } = useForm<LoginInputs>({
    defaultValues: {
      phone_number1: "+201234567899",
      password: "Subnautica455",
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit: SubmitHandler<LoginInputs> = async (credentials) => {
    const res = await signIn("credentials", {
      redirect: false,
      ...credentials,
    });

    if (res?.ok) {
      if (pathname === "/") {
        toast.success("مرحباً!");
        router.refresh();
      } else window.location.replace(callbackUrl || "/");

      return;
    }

    toast.error(res?.error || "حدث خطأ أثناء تسجيل الدخول! حاول مرة أخرى!");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-20 text-3xl [&>input]:bg-gray-300"
    >
      <div className="flex flex-col gap-10">
        <FieldSetInput
          label="رقم الهاتف"
          placeholder="+201234567890"
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
        <Button type="submit" variant="primary" onClick={() => {}}>
          تسجيل الدخول
        </Button>

        <Link
          href="#"
          className="text-olive-900 hover:text-olive-300 self-center text-2xl font-bold underline transition-colors"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>
    </form>
  );
}
