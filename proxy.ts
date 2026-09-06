import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/session-crypto";

const SESSION_COOKIE = "admin_session";

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, sessionSecret());
}

export async function proxy(request: NextRequest) {
  const authorized = await isAuthorized(request);

  const { pathname } = request.nextUrl;
  if (pathname !== "/admin/login" && !authorized) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === "/admin/login" && authorized) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*"],
};