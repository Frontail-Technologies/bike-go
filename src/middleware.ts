import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isAdminHost = host.startsWith("admin.");
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminHost) {
    if (isAdminPath) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (isAdminPath) {
    const url = request.nextUrl.clone();
    url.host = `admin.${host}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
