import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/backend/auth.config";
import { prisma } from "@/backend/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.isAdmin = user.isAdmin ?? false;
        return token;
      }
      if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { isAdmin: true, email: true },
          });
          if (!dbUser) {
            return { ...token, sub: undefined, email: undefined, isAdmin: false };
          }
          token.email = dbUser.email;
          token.isAdmin = dbUser.isAdmin;
        } catch {
          token.isAdmin = token.isAdmin ?? false;
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) return null;

        return { id: user.id, email: user.email, isAdmin: user.isAdmin };
      },
    }),
  ],
});
