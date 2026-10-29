import { NextResponse, type NextRequest } from "next/server";

// Set ADMIN_HOST when the admin subdomain doesn't follow the admin.<host> convention
// (e.g. ADMIN_HOST=bike-admin.khmer26.com). Unset, any host starting with "admin." is
// treated as the admin host, which is what makes admin.localhost:3000 work in local
// dev with zero configuration.
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const configuredAdminHost = process.env.ADMIN_HOST;
  const isAdminHost = configuredAdminHost ? host === configuredAdminHost : host.startsWith("admin.");
  const { pathname } = request.nextUrl;
  // Public files (/hero/welcome.jpg), metadata routes (/manifest.webmanifest, /icon.svg) and Next
  // internals are shared by both apps. Rewriting them into /admin/... would 404 them, including
  // the image optimizer's own fetch of the source file.
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
