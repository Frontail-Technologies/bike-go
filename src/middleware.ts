import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const configuredAdminHost = process.env.ADMIN_HOST;
  const isAdminHost = configuredAdminHost ? host === configuredAdminHost : host.startsWith("admin.");
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next/") || /\.\w+$/.test(pathname)) return NextResponse.next();
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminHost) {
    if (isAdminPath) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (isAdminPath) {
    const url = request.nextUrl.clone();
    url.host = configuredAdminHost || `admin.${host}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
