"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import { LoginInputs } from "@/types/auth";
import toast from "react-hot-toast";

export default function LoginForm() {
  const { register, handleSubmit } = useForm<LoginInputs>({
    defaultValues: {
      phone_number1: "+201234567899",
      password: "Subnautica455",
    },
  });

  const onSubmit: SubmitHandler<LoginInputs> = async (credentials) => {
    const res = await signIn("credentials", {
      redirect: false,
      ...credentials,
    });

    if (res?.ok) return window.location.replace("/");

    toast.error(res?.error || "حدث خطأ أثناء تسجيل الدخول! حاول مرة أخرى!");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center justify-center gap-10 py-150 text-3xl [&>input]:bg-gray-300"
    >
      <label htmlFor="phone_number1">Phone Number</label>
      <input id="phone_number1" {...register("phone_number1")} />

      <label htmlFor="password">Password</label>
      <input type="password" id="password" {...register("password")} />

      <Button type="submit" variant="primary" onClick={() => {}}>
        تسجيل الدخول
      </Button>
    </form>
  );
}
