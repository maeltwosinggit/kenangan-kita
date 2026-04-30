import Image from "next/image";
import Link from "next/link";
import { SignInNavButton, HeroCTAButtons } from "@/components/landing-buttons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Image src="/logo.png" alt="Kenangan Kita" width={80} height={40} unoptimized className="object-contain" />
        </Link>
        <SignInNavButton />
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Your digital disposable camera
        </h1>
        <p className="mt-5 text-lg text-slate-500">
          Scan a QR, snap your shot, and watch the shared gallery come alive — in real time.
        </p>
        <HeroCTAButtons />
      </section>

      {/* Features */}
      <section id="how-it-works" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold text-slate-800">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="font-semibold text-slate-800">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Kenangan Kita. All rights reserved.
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "📷",
    title: "Scan & Shoot",
    description:
      "Guests scan the event QR code, take photos straight from their browser — no app download needed.",
  },
  {
    icon: "🖼",
    title: "Shared Gallery",
    description:
      "All photos appear in a shared gallery instantly or after the event — you control when.",
  },
  {
    icon: "🛡",
    title: "Admin Controls",
    description:
      "Moderate photos, toggle gallery visibility, and manage guests from a simple admin dashboard.",
  },
];

