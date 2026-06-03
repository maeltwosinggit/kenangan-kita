import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Robust origin detection for redirects.
function getPublicOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

function makeRedirect(request: NextRequest, pathname: string, search = ""): URL {
  const url = new URL(pathname, getPublicOrigin(request));
  if (search) url.search = search;
  return url;
}

// Paths that never require authentication.
// /e/[code]/camera requires login — guests must sign in before capturing.
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/privacy" || pathname.startsWith("/auth/")) return true;
  if (!pathname.startsWith("/e/")) return false;
  // Camera sub-path requires auth; landing and gallery are public
  const segments = pathname.split("/"); // ['', 'e', code, ...rest]
  const rest = segments[3]; // undefined | 'camera' | 'gallery'
  return rest !== "camera";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Collect cookies the Supabase client wants to refresh — applied to the
  // final response after it is constructed.
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  // ── AUTHENTICATED REDIRECTS (Root & Login) ──
  // If user is signed in and on /, redirect to dashboard
  if (user && pathname === "/") {
    const response = NextResponse.redirect(makeRedirect(request, "/dashboard"));
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
  }

  // If user is signed in and on /login, redirect to dashboard
  if (user && pathname === "/login") {
    const response = NextResponse.redirect(makeRedirect(request, "/dashboard"));
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
  }

  // ── GUEST ACCESS TO PUBLIC PATHS ──
  if (isPublicPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    
    // If authenticated on a public path, still forward headers
    if (user) {
      requestHeaders.set("x-user-id", user.id);
      requestHeaders.set("x-user-email", user.email ?? "");
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
  }

  // ── PROTECTED ROUTES (Non-public) ──
  if (!user) {
    return NextResponse.redirect(
      makeRedirect(request, "/login", `?next=${encodeURIComponent(pathname)}`)
    );
  }

  // Authenticated — check roles/claims
  const appRole = (user?.app_metadata?.app_role as string | undefined)
    ?? (user?.user_metadata?.app_role as string | undefined)
    ?? null;

  if (pathname.startsWith("/admin")) {
    let isAdmin = appRole === "admin";

    if (!isAdmin && appRole === null) {
      try {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        isAdmin = profile?.role === "admin";
      } catch { /* ignore */ }
    }

    if (!isAdmin) {
      return NextResponse.redirect(makeRedirect(request, "/"));
    }
  }

  // Forward validated user info to server components via request headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-email", user.email ?? "");
  requestHeaders.set("x-user-name",
    ((user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined) ?? ""
  );
  requestHeaders.set("x-user-avatar",
    (user.user_metadata?.avatar_url as string | undefined) ?? ""
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply any session cookies the Supabase client refreshed.
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"]
};
