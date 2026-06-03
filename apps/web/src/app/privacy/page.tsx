import Link from "next/image";
import LinkNext from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-slate-800">
      <LinkNext href="/" className="mb-8 inline-flex items-center text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Home
      </LinkNext>

      <h1 className="mb-2 text-4xl font-black tracking-tight text-slate-900 uppercase">Privacy Policy</h1>
      <p className="mb-10 text-sm font-bold text-slate-400 uppercase tracking-widest">Last Updated: June 2, 2026</p>

      <section className="space-y-8 leading-relaxed">
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">1. Introduction</h2>
          <p>
            Welcome to <strong>Kenangan Kita</strong> ("we," "our," or "us"). We operate the website 
            <LinkNext href="https://kenangankita.fotomovement.com" className="text-indigo-600 hover:underline"> kenangankita.fotomovement.com</LinkNext> 
            (the "Service"). This Privacy Policy explains how we collect, use, and protect your information when 
            you use our digital disposable camera platform.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">2. Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">A. Personal Data via Google OAuth</h3>
              <p>
                When you sign in using Google, we collect your <strong>Email Address</strong>, <strong>Name</strong>, 
                and <strong>Profile Picture URL</strong>. This information is used solely to create your account and 
                identify you as the owner of your uploaded memories.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">B. User Content (Photos)</h3>
              <p>
                We collect and store the <strong>Photos</strong> you choose to upload to our events. These photos 
                are stored securely in our private cloud storage (Supabase) and are only accessible based on 
                the event's gallery visibility settings.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">3. How We Use Information</h2>
          <p>We use the collected data for the following purposes:</p>
          <ul className="mt-2 list-disc pl-5 space-y-2">
            <li>To provide and maintain our Service.</li>
            <li>To manage your account and event ownership.</li>
            <li>To allow you to participate in interactive features of our Service.</li>
            <li>To process payments and transactions (via Stripe).</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using <strong>Supabase</strong> (PostgreSQL database and Storage). 
            We implement industry-standard security measures to protect your personal information. However, 
            no method of transmission over the Internet is 100% secure.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">5. Third-Party Services</h2>
          <p>We may employ third-party companies due to the following reasons:</p>
          <ul className="mt-2 list-disc pl-5 space-y-2">
            <li><strong>Supabase:</strong> For database and cloud storage.</li>
            <li><strong>Vercel:</strong> For web hosting and analytics.</li>
            <li><strong>Stripe:</strong> For secure payment processing.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">6. Your Data Rights</h2>
          <p>
            You have the right to access, update, or delete the information we have on you. 
            You can delete your events and photos directly through the Dashboard at any time. 
            To request permanent account deletion, please contact us at the email below.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 uppercase tracking-tight">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via email:
            <br />
            <a href="mailto:ungkuadrian@gmail.com" className="font-bold text-indigo-600 hover:underline">
              ungkuadrian@gmail.com
            </a>
          </p>
        </div>
      </section>

      <footer className="mt-20 border-t border-slate-100 pt-10 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Kenangan Kita by Foto Movement. All rights reserved.
      </footer>
    </main>
  );
}
