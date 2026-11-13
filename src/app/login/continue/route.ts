import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = request.nextUrl.clone();
  const callback = url.searchParams.get("callbackUrl");
  url.pathname = "/login";
  url.search = "";

  if (!session?.user?.id) return NextResponse.redirect(url);

  const admin = session.user.role === "ADMIN";
  url.pathname = admin ? "/admin" : "/membership";
  if (callback?.startsWith("/") && !callback.startsWith("//") && !callback.includes("\\")) {
    const destination = new URL(callback, url.origin);
    const adminPath = destination.pathname === "/admin" || destination.pathname.startsWith("/admin/");
    const loginPath = destination.pathname === "/login" || destination.pathname.startsWith("/login/");
    if (destination.origin === url.origin && !loginPath && (!adminPath || admin)) {
      url.pathname = destination.pathname;
      url.search = destination.search;
    }
  }

  return NextResponse.redirect(url);
}
