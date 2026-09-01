"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  FolderLock,
  Cpu,
  ScrollText,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-task", label: "New Task", icon: FilePlus2 },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/documents", label: "Documents", icon: FolderLock },
  { href: "/models", label: "AI Models", icon: Cpu },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/security", label: "Network Security", icon: Shield },
  { href: "/demos", label: "Demo Center", icon: Sparkles },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-700 text-white">
              <BrandMark />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide text-slate-900">SentinelAI</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Secure AI Workbench</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-cyan-50 text-cyan-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-cyan-700" : "text-slate-400 group-hover:text-slate-600")} />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-600" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">System Secure</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              Local processing
              <br />
              <span className="text-slate-500">External AI: 0 connections</span>
            </p>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-400">V1 · Prototype</p>
        </div>
      </aside>
    </>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}
