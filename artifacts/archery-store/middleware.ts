import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const role = request.headers.get("x-user-role") || request.cookies.get("user-role")?.value;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      // For now, allow access (stub auth) — in production, redirect to login
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
