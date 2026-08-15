import { NextResponse, type ProxyConfig } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { JwtToken } from "@/types/auth";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as JwtToken | null;
    const pathname = req.nextUrl.pathname;
    const userRole = token?.role;

    // console.log(pathname);
    // console.log(userRole);

    if (pathname === "/dashboard") {
      switch (userRole) {
        case "admin": {
          return NextResponse.redirect(
            new URL("/dashboard/todays-staff-attendances", req.url),
          );
        }

        case "instructor": {
          return NextResponse.redirect(
            new URL("/dashboard/todays-schedule", req.url),
          );
        }

        case "parent":
        case "student": {
          return NextResponse.redirect(new URL("/dashboard/overview", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        const isLoggedOut = !token || !!token.error;

        return !isLoggedOut;
      },
    },

    pages: {
      signIn: "/?login=true",
    },
  },
);

export const config: ProxyConfig = {
  matcher: ["/dashboard/:path*"],
};
