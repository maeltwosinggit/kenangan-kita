"use client";

import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nextPath = params.get("next") || "/";

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    });
  };

  const onEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setEmailLoading(false);
      return;
    }
    router.push(nextPath);
    router.refresh();
  };

  const anyLoading = googleLoading || emailLoading;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-4 py-12">
      <Image
        src="/logo.png"
        alt="Kenangan Kita"
        width={140}
        height={140}
        priority
        unoptimized
        className="mb-4"
      />

      <section className="w-full rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-semibold">Sign In</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your Kenangan Kita account.</p>

        {error && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Email / password */}
        <form onSubmit={onEmailSignIn} className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={anyLoading}
            className="w-full rounded border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={anyLoading}
            className="w-full rounded border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={anyLoading}
            className="w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {emailLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t border-slate-200" />
          <span className="mx-3 text-xs text-slate-400">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={anyLoading}
          className="flex w-full items-center justify-center gap-2 rounded border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
