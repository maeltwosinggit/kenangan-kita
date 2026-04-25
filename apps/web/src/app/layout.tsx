import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { QueryProvider } from "@/providers/query-provider";
import ConditionalHeader from "@/components/conditional-header";

export const metadata: Metadata = {
  title: "Kenangan Kita",
  description: "Digital disposable camera for events",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ConditionalHeader />
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}

