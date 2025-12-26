"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";

interface LoginInputs {
  email: string;
  password: string;
}

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  const onSubmit: SubmitHandler<LoginInputs> = async (credentials) => {
    await signIn("credentials", {
      redirect: false,
      ...credentials,
    });

    window.location.replace("/");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center justify-center gap-10 text-3xl [&>input]:bg-gray-300"
    >
      <label htmlFor="email">Email</label>
      <input type="email" id="email" {...register("email")} />

      <label htmlFor="password">Password</label>
      <input type="password" id="password" {...register("password")} />

      <Button variant="primary" onClick={() => {}}>
        تسجيل الدخول
      </Button>
    </form>
  );
}
