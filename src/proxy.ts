import { withAuth } from "next-auth/middleware";
import { previewSessionCookie } from "@/lib/sessionCookie";

const sessionToken = previewSessionCookie();

export default withAuth(
  // Current account status and role are checked in server pages/layouts and APIs.
  // The JWT role is a snapshot and must not block a newly promoted admin.
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
