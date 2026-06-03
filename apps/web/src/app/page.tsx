import Image from "next/image";
import Link from "next/link";
import { HeroCTAButtons } from "@/components/landing-buttons";
import LandingNav from "@/components/landing-nav";

export default function LandingPage() {
  return (
    <div className="min-h-screen-fix bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Nav */}
      <LandingNav />

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-slate-200/40 to-transparent rounded-full blur-3xl -z-10 opacity-70" />
         
         <div className="mx-auto max-w-3xl text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">The Modern Disposable Camera</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100 fill-mode-both">
              Capture memories,<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">not just photos.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
              No apps to download. No disposable cameras to develop. Scan a QR, snap the shot, and watch the gallery come alive in real-time.
            </p>
            
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
               <HeroCTAButtons />
            </div>
         </div>
      </section>

      {/* Editorial Feature Image / Mockup (Placeholder) */}
      <section className="mx-auto max-w-5xl px-6 pb-24 md:pb-32 relative z-20 -mt-12 md:-mt-20">
         <div className="w-full aspect-video md:aspect-[21/9] bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden relative border-8 border-white ring-1 ring-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
               <div className="text-center space-y-6">
                  <span className="material-symbols-outlined text-white/20 text-[120px]">photo_camera</span>
               </div>
            </div>
            {/* Film Grain Overlay */}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
         </div>
      </section>

      {/* Features Grid */}
      <section id="how-it-works" className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
             <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">Designed for the moment.</h2>
             <p className="text-slate-500 font-medium text-lg">We stripped away the complexity so your guests can focus on what matters: the party.</p>
          </div>
          
          <div className="grid gap-x-8 gap-y-16 md:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 transition-transform group-hover:-translate-y-1 duration-300">
                   <span className="material-symbols-outlined text-[28px] text-slate-800">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Tiers */}
      <section className="bg-slate-900 py-24 md:py-32 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
        
        <div className="mx-auto max-w-5xl px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
             <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Simple, transparent pricing.</h2>
             <p className="text-slate-400 font-medium">Whether it's a small dinner or a grand wedding, we have a plan that fits your memory vault.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             <div className="rounded-3xl bg-slate-800/50 border border-slate-700 p-8 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-4xl font-black">RM0</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> 25 Guest Uploads</li>
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> 7 Days Storage</li>
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> Web Gallery</li>
                </ul>
             </div>
             
             <div className="rounded-3xl bg-white p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Most Popular</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-4xl font-black text-slate-900">RM79</span>
                   <span className="text-sm font-bold text-slate-400">/event</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex gap-3 text-slate-600 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-indigo-600">check_circle</span> Unlimited Uploads</li>
                   <li className="flex gap-3 text-slate-600 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-indigo-600">check_circle</span> 30 Days Storage</li>
                   <li className="flex gap-3 text-slate-600 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-indigo-600">check_circle</span> Digital Photobook</li>
                   <li className="flex gap-3 text-slate-600 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-indigo-600">check_circle</span> High-Res Downloads</li>
                </ul>
             </div>

             <div className="rounded-3xl bg-slate-800/50 border border-slate-700 p-8 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">Wedding</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-4xl font-black">RM199</span>
                   <span className="text-sm font-bold text-slate-400">/event</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> Everything in Pro</li>
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> 1 Year Storage</li>
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> Custom Event Cover</li>
                   <li className="flex gap-3 text-slate-300 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-slate-500">check_circle</span> All-Access ZIP Export</li>
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
         <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
               <Image src="/logo.png" alt="Kenangan Kita" width={80} height={40} unoptimized className="object-contain grayscale opacity-60" />
            </div>
            
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
               <Link href="#" className="hover:text-slate-900 transition-colors opacity-50 cursor-not-allowed">Terms of Service</Link>
            </div>
            
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               © {new Date().getFullYear()} Foto Movement.
            </p>
         </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "qr_code_scanner",
    title: "Zero Friction",
    description:
      "Guests scan the QR code and shoot instantly. No app downloads, no account creation required.",
  },
  {
    icon: "photo_library",
    title: "Shared Perspective",
    description:
      "Every photo goes directly into a unified event gallery. See your party through everyone's eyes.",
  },
  {
    icon: "admin_panel_settings",
    title: "Host Controls",
    description:
      "Hide the gallery until the event ends, moderate photos, and download the entire collection in high-res.",
  },
];

