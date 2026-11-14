import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { previewSessionCookie } from "@/lib/sessionCookie";

const sessionToken = previewSessionCookie();

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Proteksi khusus rute admin: hanya untuk role ADMIN
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=AdminAccessRequired", req.url));
    }

    return NextResponse.next();
  },
  {
    ...(sessionToken && { cookies: { sessionToken } }),
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/coin/:path*",
    "/membership/:path*",
    "/video/:path*",
    "/quiz/:path*",
  ],
};
