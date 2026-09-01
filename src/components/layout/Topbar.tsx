"use client";

import { Menu, Shield, Bell } from "lucide-react";
import { LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/components/providers/AppProvider";
import { usePathname } from "next/navigation";

const titleMap: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Secure AI Operations Center", subtitle: "Monitor confidential AI workloads, local models and security status." },
  "/new-task": { title: "Create New AI Task", subtitle: "Process confidential information using secure local AI capabilities." },
  "/tasks": { title: "AI Tasks", subtitle: "History of confidential AI workloads and their execution status." },
  "/tasks/[id]": { title: "Task Details", subtitle: "Detailed view of a confidential AI workload." },
  "/tasks/[id]/execute": { title: "AI Task Execution", subtitle: "Secure local workflow with audit and verification." },
  "/documents": { title: "Local Document Repository", subtitle: "Documents stored and processed within the secure local workspace." },
  "/models": { title: "Local AI Capabilities", subtitle: "Available local AI capabilities and their readiness status." },
  "/audit": { title: "Audit Trail", subtitle: "Comprehensive record of task lifecycle and security events." },
  "/security": { title: "Network Security", subtitle: "Visibility into local and external network activity." },
  "/demos": { title: "Demo Center", subtitle: "Preconfigured scenarios for demonstrating SentinelAI." },
};

function matchPath(pathname: string, key: string) {
  if (key.includes("[")) {
    const base = key.split("/[")[0];
    return pathname.startsWith(base);
  }
  return pathname === key;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname() ?? "/dashboard";
  const metaEntry = Object.entries(titleMap).find(([k]) => matchPath(pathname, k));
  const meta = metaEntry?.[1] ?? titleMap["/dashboard"];
  const { tasks } = useApp();
  const active = tasks.filter((t) => t.status === "processing").length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:text-cyan-700 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="hidden flex-col md:flex">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">SentinelAI Workbench</span>
            <span className="text-sm font-medium text-slate-800">{meta.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LocalOnlyBadge />
          <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 md:flex">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Air-gap active</span>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 lg:flex">
            <Bell className="h-3.5 w-3.5 text-slate-500" />
            <span>
              {active} active {active === 1 ? "task" : "tasks"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
