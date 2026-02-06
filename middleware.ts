import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { valid } = await verifySessionCookie(cookieValue);

  if (!valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
