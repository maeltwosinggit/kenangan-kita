import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
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
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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
      const deniedUrl = new URL("/admin/login", request.url);
      deniedUrl.searchParams.set("denied", "1");
      return NextResponse.redirect(deniedUrl);
    }
  }

  return response;
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"]
};

