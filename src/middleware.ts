import { NextRequest, NextResponse } from "next/server";

// Keep in sync with SESSION_COOKIE in src/lib/auth.ts. Inlined here because
// middleware runs on the edge runtime and must not import Node-only modules.
const SESSION_COOKIE = "clm_session";

// Fast edge-level gate: if there is no session cookie, send the user to /login.
// Full session validation (existence + expiry) happens server-side in requireUser().
export function middleware(req: NextRequest) {
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, the login page, and the public
  // metadata/icon files (these must load without a session, e.g. on the login
  // screen and for "Add to Home Screen").
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|manifest.webmanifest|icon.svg|apple-icon).*)",
  ],
};
