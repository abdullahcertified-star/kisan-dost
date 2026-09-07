import type { Metadata } from "next";
import "./globals.css";
import SecurityCleanup from "@/components/SecurityCleanup";

export const metadata: Metadata = {
  title: "Kisan Dost (کسان دوست) — AI Agronomy & Mandi Assistant",
  description: "Modern agricultural advisory, verified mandi rates, fertilizer calculation, and AI crop diagnostics for Pakistani farmers.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8faf9] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <SecurityCleanup />
        {children}
      </body>
    </html>
  );
}
