"use server";

import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import apiClient from "@/lib/axios";
import { SignupInputs, UserEntity } from "@/types/auth";
import axios from "axios";
import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";

export async function signUp(data: SignupInputs) {
  let errors: Record<keyof SignupInputs, string[]> | null = null;

  try {
    await apiClient.post("/auth/users/", data);
  } catch (err) {
    if (axios.isAxiosError(err)) errors = err.response?.data;
  }

  return { errors };
}

export async function redirectAuthUser() {
  const session: (Session & UserEntity) | null =
    await getServerSession(authConfig);

  const isAuth = !!session && !session.error;

  if (isAuth) redirect("/");
}

export async function getUser() {
  const session = (await getServerSession(authConfig)) as
    | (Session & { user: UserEntity })
    | null;

  if (!session?.user) redirect("/");

  return session.user;
}
