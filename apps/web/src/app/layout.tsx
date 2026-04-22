import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Kenangan Kita",
  description: "Digital disposable camera for events"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

