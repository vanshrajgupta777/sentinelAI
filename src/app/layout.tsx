import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelAI Workbench — Secure Local AI for Confidential Knowledge",
  description:
    "SentinelAI Workbench — Secure AI orchestration for confidential industrial, defence and government information. Local processing, audit logging, no external AI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
