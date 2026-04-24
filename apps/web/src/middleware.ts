import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// When behind a reverse proxy (e.g. ngrok), request.nextUrl.origin may be the
// internal bind address (0.0.0.0:3000). Use forwarded headers instead.
function getPublicOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

function makeRedirect(request: NextRequest, pathname: string, search = ""): URL {
  const url = new URL(pathname, getPublicOrigin(request));
  if (search) url.search = search;
  return url;
}

// Paths that never require authentication
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/auth/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const response = NextResponse.next({ request });
    response.headers.set("x-pathname", pathname);
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(makeRedirect(request, "/admin/login"));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth check failed — redirect to login
    return NextResponse.redirect(makeRedirect(request, "/admin/login"));
  }

  if (!user) {
    return NextResponse.redirect(
      makeRedirect(request, "/admin/login", `?next=${encodeURIComponent(pathname)}`)
    );
  }

  // Authenticated — check admin role for /admin/* paths
  if (pathname.startsWith("/admin")) {
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = profile?.role === "admin";
    } catch {
      // Profile check failed — deny access
    }

    if (!isAdmin) {
      return NextResponse.redirect(makeRedirect(request, "/admin/login", "?denied=1"));
    }
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"]
};
