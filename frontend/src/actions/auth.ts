"use server";

import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import apiClient from "@/lib/axios";
import { SignupInputs, UserEntity } from "@/types/auth";
import axios from "axios";
import { getServerSession, Session } from "next-auth";
import { decode, JWT } from "next-auth/jwt";
import { cookies } from "next/headers";
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

  if (isAuth) redirect("/dashboard");
}

export async function getUser() {
  const session = (await getServerSession(authConfig)) as
    | (Session & { user: UserEntity })
    | null;

  if (!session?.user) redirect("/");

  return session.user;
}

export async function protect(
  allowedRoles: ("admin" | "parent" | "instructor" | "student")[],
) {
  const { role } = await getUser();

  if (allowedRoles.includes(role)) return;

  redirect("/dashboard");
}

export async function getServerJwtToken() {
  const cookieStore = await cookies();

  const tokenCookie =
    cookieStore.get("__Secure-next-auth.session-token") ||
    cookieStore.get("next-auth.session-token");

  if (!tokenCookie) {
    console.error("No Token Cookie Found!");
    return null;
  }

  try {
    const decodedToken = await decode({
      token: tokenCookie.value,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    return decodedToken as JWT &
      UserEntity & {
        sub: string;
        iat: number;
        jti: string;
        exp: number;
        jwt_access_token: string;
        jwt_refresh_token: string;
      };
  } catch (error) {
    console.error("Token Decryption Failed:", error);
    return null;
  }
}
