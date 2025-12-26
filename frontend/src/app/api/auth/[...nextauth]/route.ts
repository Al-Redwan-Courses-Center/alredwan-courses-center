import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize() {
        const user: any = {
          sub: "01234567890123",
          firstName: "\tAmir",
          lastName: "Shaaban",
          email: "amirshaaban39@gmail.com",
          phone: "+20 123 456 7890",
          address: "Ismailia, Ismailia Governorate, Egypt",
          birthDate: "2004-10-15",
          image: "user.jpg",
          imageHD: "userHD.jpg",
          major: "Computer & Control Engineering",
          level: 3,
          gpa: 3.85,
          totalCredits: 175,
          completedCredits: 92,
          enrollmentStatus: "Active",
        };

        user.id = user.sub;

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },

    async session({ session, token }) {
      const { sub, iat, jti, exp, ...user } = token;

      session.user = user;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
