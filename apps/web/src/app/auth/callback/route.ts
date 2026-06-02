import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // ... rest of logic

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: existingProfile, error: selectError } = await supabase
        .from("admin_profiles")
        .select("user_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (selectError) {
        throw selectError;
      }

      let role: string | null = existingProfile?.role ?? null;

      if (!existingProfile) {
        const { data: inserted, error: insertError } = await supabase
          .from("admin_profiles")
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            email: user.email ?? null,
            role: "user"
          })
          .select("role")
          .single();

        if (insertError) {
          throw insertError;
        }
        role = inserted?.role ?? "user";
      }

      // Robust origin detection
      const host = request.headers.get("x-forwarded-host");
      const proto = request.headers.get("x-forwarded-proto") || "https";
      const base = host ? `${proto}://${host}` : request.nextUrl.origin;
      
      let destination: string;
      if (role === "admin") {
        destination = next;
      } else if (next.startsWith("/e/")) {
        destination = next;
      } else {
        destination = "/dashboard";
      }
      return NextResponse.redirect(`${base}${destination}`);
    }
  }

  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : request.nextUrl.origin;
  
  return NextResponse.redirect(`${base}${next}`);
}

