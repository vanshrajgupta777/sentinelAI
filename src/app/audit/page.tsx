"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScrollText, Search, Filter, Shield, Cpu, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AuditEvent } from "@/types";

const categoryFilters = ["All", "Tasks", "Documents", "AI", "Security"] as const;
const statusFilters = ["All", "Info", "Success", "Warn"] as const;

export default function AuditPage() {
  const { audit } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categoryFilters)[number]>("All");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");

  const filtered = useMemo(() => {
    return audit.filter((e) => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q || e.action.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q);
      const matchesC = category === "All" || e.category === category.toUpperCase();
      const matchesS =
        statusFilter === "All" ||
        (statusFilter === "Info" && e.status === "INFO") ||
        (statusFilter === "Success" && e.status === "SUCCESS") ||
        (statusFilter === "Warn" && e.status === "WARN");
      return matchesQ && matchesC && matchesS;
    });
  }, [audit, query, category, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        subtitle="Comprehensive record of task lifecycle and security events."
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <div className="flex items-center gap-1">
              {categoryFilters.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider",
                    category === c
                      ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="ml-2 flex items-center gap-1">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider",
                    statusFilter === s
                      ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search audit events..."
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600/30"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No audit events" description="Adjust filters or run a task to generate events." icon={<ScrollText className="h-5 w-5" />} />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <AuditRow key={e.id} event={e} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  const Icon =
    event.category === "TASKS"
      ? FileText
      : event.category === "DOCUMENTS"
      ? FileText
      : event.category === "AI"
      ? Cpu
      : Shield;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "flex h-8 w-8 flex-none items-center justify-center rounded-md border bg-white",
          event.category === "TASKS" && "border-cyan-200 text-cyan-700",
          event.category === "DOCUMENTS" && "border-indigo-200 text-indigo-700",
          event.category === "AI" && "border-emerald-200 text-emerald-700",
          event.category === "SECURITY" && "border-amber-200 text-amber-700",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800">{event.action}</p>
          <StatusBadge
            variant={event.status === "SUCCESS" ? "success" : event.status === "WARN" ? "warn" : "info"}
            dot
          >
            {event.status}
          </StatusBadge>
          {event.category === "SECURITY" && event.status === "WARN" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
              <AlertTriangle className="h-3 w-3" /> Blocked
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600">{event.detail}</p>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">{event.category}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-700">
          {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="text-[10px] text-slate-500">
          {new Date(event.timestamp).toLocaleDateString()}
        </p>
      </div>
    </li>
  );
}
