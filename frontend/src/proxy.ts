import { withAuth } from "next-auth/middleware";
import { NextResponse, ProxyConfig } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const userRole = token?.role;

    // console.log(pathname);
    // console.log(userRole);

    switch (userRole) {
      case "instructor": {
        if (pathname === "/dashboard") {
          return NextResponse.redirect(
            new URL("/dashboard/todays-schedule", req.url),
          );
        }

        break;
      }

      case "parent":
      case "student": {
        if (pathname === "/dashboard") {
          return NextResponse.redirect(new URL("/dashboard/overview", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        const isLoggedOut = !token || !!token.error;

        if (isLoggedOut) return false;

        return true;
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
