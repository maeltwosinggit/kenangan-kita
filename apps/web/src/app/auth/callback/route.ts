import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin/events";

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

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

      // Non-admins go to root; admins go to the requested next path
      const host = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
      const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
      const destination = role === "admin" ? next : "/";
      return NextResponse.redirect(`${proto}://${host}${destination}`);
    }
  }

  // Use forwarded headers so redirect goes to the public host (e.g. ngrok)
  // not the internal bind address (0.0.0.0:3000)
  const host = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return NextResponse.redirect(`${proto}://${host}${next}`);
}

