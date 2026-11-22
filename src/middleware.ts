import { type NextRequest, NextResponse } from "next/server";
import { expectedToken, isGateEnabled, SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_PREFIXES = ["/login", "/api/adobe/"];

export async function middleware(request: NextRequest) {
  if (!isGateEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && token === (await expectedToken())) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
