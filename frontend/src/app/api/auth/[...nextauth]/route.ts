import { jwtDecode } from "jwt-decode";
import NextAuth, { type AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { logApiError, publicApiClient } from "@/lib/api";
import type { UserEntity } from "@/types/auth";
import type { PaginatedResponse } from "@/types/config";
import type { Instructor } from "@/types/entities";

export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone_number1: {},
        password: {},
      },
      async authorize(credentials) {
        console.log("NextAuth Authorize started with credentials:", JSON.stringify(credentials));
        try {
          const tokenRes = await publicApiClient.post<{
            access: string;
            refresh: string;
          }>("/auth/jwt/create/", credentials);

          const {
            data: { access, refresh },
          } = tokenRes;

          console.log("Token response success. Access token exists:", !!access);
          if (!access || !refresh) return null;

          const userRes = await publicApiClient.get<UserEntity>(
            "/auth/users/me/",
            {
              headers: {
                Authorization: `JWT ${access}`,
              },
            },
          );

          const user: UserEntity = userRes.data;
          console.log("Fetched user data successfully:", JSON.stringify(user));

          const { exp } = jwtDecode(access);

          if (user.role === "instructor" && !user.instructor_id) {
            try {
              const instructorRes = await publicApiClient.get<
                PaginatedResponse<Instructor>
              >(
                `/api/users/instructors/?user__phone_number1__exact=${encodeURIComponent(user.phone_number1)}`,
                {
                  headers: {
                    Authorization: `JWT ${access}`,
                  },
                },
              );

              if (
                instructorRes.data?.results &&
                instructorRes.data.results.length > 0
              ) {
                const matchedInstructor = instructorRes.data.results[0];
                if (matchedInstructor?.id) {
                  user.instructor_id = String(matchedInstructor.id);
                }
              }
            } catch (err) {
              logApiError("Error fetching instructor profile:", err);
            }
          }

          user.jwt_access_token = access;
          user.jwt_refresh_token = refresh;
          user.exp = exp || Date.now();
          return user;
        } catch (error: any) {
          console.error("NextAuth authorize failed. Error message:", error.message);
          if (error.response) {
            console.error("Response error data:", JSON.stringify(error.response.data));
            console.error("Response error status:", error.response.status);
          }
          return null;
        }
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
          const res = await publicApiClient.post<{ access: string }>(
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
          logApiError("Error Refreshing Token:", err);
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
