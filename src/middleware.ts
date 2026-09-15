import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Completely bypass authentication for Webhooks, Queue workers, Auth APIs, and static files
  if (
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/inngest") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // Static assets (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Check Firebase session cookie
  const isAuthenticated = request.cookies.get("salty_auth")?.value === "true";
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // 2. Unauthenticated user trying to access protected dashboard routes
  if (!isAuthenticated && !isAuthPage) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Authenticated user trying to access login/signup pages
  if (isAuthenticated && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
