import apiClient from "@/lib/axios";
import { UserEntity } from "@/types/auth";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import NextAuth, { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone_number1: {},
        password: {},
      },
      async authorize(credentials) {
        const tokenRes = await apiClient.post<{
          access: string;
          refresh: string;
        }>("/auth/jwt/create/", credentials);

        const {
          data: { access, refresh },
        } = tokenRes;

        if (!access || !refresh) return null;

        const userRes = await apiClient.get("/auth/users/me/", {
          headers: {
            Authorization: `JWT ${access}`,
          },
        });

        const user: UserEntity = userRes.data;

        const { exp } = jwtDecode(access);

        if (!user) return null;

        user.jwt_access_token = access;
        user.jwt_refresh_token = refresh;
        user.exp = exp || Date.now();

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) return { ...token, ...user };
      const now = Date.now() / 1000;
      const { exp } = token as JWT & UserEntity;
      const tokenAgeLeft = Math.floor((exp || now) - now);
      if (tokenAgeLeft <= 60) {
        try {
          const { jwt_refresh_token } = token as JWT & UserEntity;
          const res = await apiClient.post<{ access: string }>(
            "/auth/jwt/refresh/",
            {
              refresh: jwt_refresh_token,
            },
          );
          const { data: { access } = {} } = res;
          if (!access) throw new Error("Token Refreshment Failed!");
          const { exp } = jwtDecode(access);
          return { ...token, jwt_access_token: access, exp, error: undefined };
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error("Backend Error Data:", err.response?.data);
          }
          console.error("Error Refreshing Token:", err);
          return { ...token, error: "TokenRefreshmentError" };
        }
      }

      return token;
    },

    async session({ session, token }) {
      const {
        sub,
        iat,
        jti,
        exp,
        jwt_access_token,
        jwt_refresh_token,
        ...user
      } = token;
      session.user = user;

      return session;
    },
  },

  pages: {
    signIn: "/?login=true",
  },
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
