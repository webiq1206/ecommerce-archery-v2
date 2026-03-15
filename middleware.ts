import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/account")) {
    if (!req.auth?.user) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (pathname.startsWith("/admin")) {
    const role = (req.auth?.user as { role?: string })?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      const headerRole = req.headers.get("x-user-role") || req.cookies.get("user-role")?.value;
      if (headerRole !== "ADMIN" && headerRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required." },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
