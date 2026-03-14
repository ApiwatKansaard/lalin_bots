import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findAdminByEmail } from "./sheets";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const admin = await findAdminByEmail(user.email);
      return !!admin;
    },
    async session({ session }) {
      if (session.user?.email) {
        const admin = await findAdminByEmail(session.user.email);
        if (admin) {
          (session as SessionWithRole).role = admin.role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/access-denied",
  },
};

export interface SessionWithRole {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
  role?: string;
}
