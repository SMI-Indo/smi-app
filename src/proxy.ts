import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Proteksi khusus rute admin: hanya untuk role ADMIN
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Admin route: wajib role ADMIN
        if (pathname.startsWith("/admin")) {
          return token?.role === "ADMIN";
        }

        // Member routes: wajib login
        return !!token;
      },
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
