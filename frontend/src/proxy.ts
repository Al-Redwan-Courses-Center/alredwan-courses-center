import { withAuth } from "next-auth/middleware";
import { ProxyConfig } from "next/server";

export default withAuth({
  callbacks: {
    authorized({ token }) {
      const isLoggedOut = !token || !!token.error;

      if (isLoggedOut) return false;

      return true;
    },
  },

  pages: {
    signIn: "/login",
  },
});

export const config: ProxyConfig = {
  matcher: ["/dashboard/:path*"],
};
