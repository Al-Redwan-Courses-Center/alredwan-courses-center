"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import { decode, type JWT } from "next-auth/jwt";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { publicApiClient } from "@/lib/api";
import type { SignupInputs, UserEntity } from "@/types/auth";

export async function signUp(data: SignupInputs) {
  let errors: Record<string, string[]> | null = null;

  try {
    await publicApiClient.post("/auth/users/", data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      errors = err.response.data as Record<string, string[]>;
    } else {
      errors = {
        error: [
          "حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.",
        ],
      };
    }
  }

  return { errors };
}

export async function redirectAuthUser() {
  const session: (Session & UserEntity) | null =
    await getServerSession(authConfig);

  const isAuth = !!session && !session.error;

  if (isAuth) redirect("/dashboard");
}

export async function getOptionalUser(): Promise<UserEntity | null> {
  const session = (await getServerSession(authConfig)) as
    | (Session & { user: UserEntity })
    | null;

  return session?.user ?? null;
}

export async function getUser() {
  const session = (await getServerSession(authConfig)) as
    | (Session & { user: UserEntity })
    | null;

  if (!session?.user) redirect("/");

  return session.user;
}

export async function protect(allowedRoles: UserEntity["role"][]) {
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

    if (!decodedToken) {
      return null;
    }


    if (decodedToken.exp) {
      if (typeof decodedToken.exp !== "number") {
        console.warn("No expiry");
        return null;
      }
      if (decodedToken.exp < Math.floor(Date.now() / 1000)) {
        console.warn("Token has expired!");
        return null;
      }
    }

    return decodedToken as JWT &
      UserEntity & {
        sub: string;
        iat: number;
        jti: string;
        exp: number;
        jwt_access_token: string;
        jwt_refresh_token: string;
      };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Token Decryption Failed:", error);
    return null;
  }
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
  re_new_password: string;
}) {
  try {
    const { getAuthApiClient } = await import("@/lib/auth-api");
    const apiClient = await getAuthApiClient();
    await apiClient.post("/auth/users/set_password/", data);
    return { error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data ?? "حدث خطأ أثناء تغيير كلمة المرور",
      };
    }
    return { error: "حدث خطأ غير متوقع" };
  }
}

export async function resetPassword(data: { phone_number1: string }) {
  try {
    await publicApiClient.post("/auth/users/reset_password/", data);
    return { error: null };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      return {
        error:
          error.response?.data ?? "حدث خطأ أثناء طلب إعادة تعيين كلمة المرور",
      };
    }
    return { error: "حدث خطأ غير متوقع" };
  }
}

export async function getWebSocketTicket() {
  try {
    const { getAuthApiClient } = await import("@/lib/auth-api");
    const apiClient = await getAuthApiClient();
    const res = await apiClient.post<{ ticket: string }>(
      "/api/attendance/ws-ticket/",
    );
    return res.data.ticket;
  } catch {
    return null;
  }
}
