"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AppProvider } from "@/components/providers/AppProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
