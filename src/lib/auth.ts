import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { previewSessionCookie } from "./sessionCookie";
import { createHash } from "node:crypto";
import { canAccessMemberFeatures } from "./memberAccess";

function credentialVersion(password: string | null) {
  return createHash("sha256").update(password ?? "oauth-only").digest("hex");
}

const sessionToken = previewSessionCookie();

export const authOptions: AuthOptions = {
  ...(sessionToken && { cookies: { sessionToken } }),
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user || !user.password) {
          throw new Error("Email atau password salah");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Email atau password salah");
        }

        if (!canAccessMemberFeatures(user)) {
          throw new Error("Akun Anda belum disetujui atau belum memiliki nomor keanggotaan. Silakan hubungi pengurus.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isApproved: user.isApproved,
          credentialVersion: credentialVersion(user.password),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isApproved = user.isApproved;
        if ("credentialVersion" in user && typeof user.credentialVersion === "string") {
          token.credentialVersion = user.credentialVersion;
        } else {
          const current = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
          token.credentialVersion = current ? credentialVersion(current.password) : undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const current = typeof token.id === "string" ? await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, email: true, role: true, isApproved: true, memberId: true, password: true },
        }) : null;
        const active = current && token.credentialVersion === credentialVersion(current.password) &&
          canAccessMemberFeatures(current);
        session.user.id = active ? current.id : "";
        session.user.email = active ? current.email : undefined;
        session.user.role = active ? current.role : "MEMBER";
        session.user.isApproved = Boolean(active && current.isApproved);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
