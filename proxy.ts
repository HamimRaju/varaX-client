import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // This is an optimistic navigation check only. Express validates JWTs and
  // current database roles for every protected data request.
  if (getSessionCookie(request)) return NextResponse.next();

  const callbackURL = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginURL = new URL("/login", request.url);
  loginURL.searchParams.set("callbackURL", callbackURL);
  return NextResponse.redirect(loginURL);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/favorites",
    "/profile",
    "/payment",
    "/payment-success",
    "/payment-cancel",
  ],
};
