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
    pathname === "/" ||
    pathname === "/login" ||
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
    return NextResponse.redirect(makeRedirect(request, "/login"));
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

  let user = null;
  let appRole: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    // If the custom_access_token_hook is active the role is embedded in the JWT
    // and already available on the user object without a separate DB query.
    appRole = (user?.app_metadata?.app_role as string | undefined)
      ?? (user?.user_metadata?.app_role as string | undefined)
      ?? null;
  } catch {
    // Auth check failed — redirect to login
    return NextResponse.redirect(makeRedirect(request, "/login"));
  }

  if (!user) {
    return NextResponse.redirect(
      makeRedirect(request, "/login", `?next=${encodeURIComponent(pathname)}`)
    );
  }

  // Authenticated — check admin role for /admin/* paths
  if (pathname.startsWith("/admin")) {
    let isAdmin = appRole === "admin";

    // Fallback: JWT claim not present (hook not yet active) — query the DB once.
    if (!isAdmin && appRole === null) {
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
    }

    if (!isAdmin) {
      return NextResponse.redirect(makeRedirect(request, "/"));
    }
  }

  // Forward validated user info to server components via request headers.
  // This is safe: these headers are set server-side by middleware after
  // getUser() validates the JWT — no client can forge them.
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

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"]
};
