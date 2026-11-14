import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { previewSessionCookie } from "./sessionCookie";
import { createHash } from "node:crypto";

function credentialVersion(password: string | null) {
  return createHash("sha256").update(password ?? "oauth-only").digest("hex");
}

const sessionToken = previewSessionCookie();

export const authOptions: AuthOptions = {
  ...(sessionToken && { cookies: { sessionToken } }),
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "MEMBER",
          isApproved: false, // Default belum di-ACC
          coins: 0,
        };
      },
    }),
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

        // Cek status keanggotaan dari Admin (Admin bebas lewat, member wajib isApproved = true dan memiliki memberId)
        if (user.role !== "ADMIN") {
          if (!user.isApproved || !user.memberId) {
            throw new Error(
              "Akun Anda belum disetujui atau belum memiliki nomor keanggotaan. Silakan hubungi pengurus."
            );
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isApproved: user.isApproved,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          // Buat akun baru berstatus pending approval
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Anggota Baru",
              image: user.image,
              role: "MEMBER",
              isApproved: false,
              coins: 0,
            },
          });
          return "/login?error=PendingApproval";
        }

        if (existing.role !== "ADMIN" && (!existing.isApproved || !existing.memberId)) {
          return "/login?error=PendingApproval";
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isApproved = user.isApproved;
        const current = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
        token.credentialVersion = current ? credentialVersion(current.password) : undefined;
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
          (current.role === "ADMIN" || (current.isApproved && current.memberId));
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
