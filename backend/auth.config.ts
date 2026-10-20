import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const loggedIn = Boolean(auth?.user?.id);
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/space") ||
        pathname.startsWith("/assessment") ||
        pathname.startsWith("/admin");

      if (isProtected && !loggedIn) return false;
      // Let the login page decide redirects (validates session against the DB via getSession).
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.isAdmin = user.isAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (!token.sub) {
        return { expires: session.expires };
      }
      if (session.user) {
        session.user.id = token.sub;
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
