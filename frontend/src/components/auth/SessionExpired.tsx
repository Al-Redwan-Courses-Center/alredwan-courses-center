"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import Loader from "@/components/ui/Loader";

/**
 * Shown when the stored session token is rejected by the backend (expired,
 * revoked, or issued by another environment). Clears the session and sends
 * the visitor back to the login dialog instead of rendering a broken
 * dashboard full of 401 errors.
 */
export default function SessionExpired() {
  useEffect(() => {
    void signOut({ callbackUrl: "/?login=true" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-6 text-center">
      <Loader />
      <p className="text-3xl font-bold text-gray-700">
        انتهت صلاحية الجلسة، جاري تحويلك لتسجيل الدخول من جديد…
      </p>
    </div>
  );
}
