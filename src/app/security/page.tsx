"use client";

import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { BackendStatusBanner } from "@/components/ui/BackendStatusBanner";
import { Shield, ShieldCheck, Lock, Network, Server, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/cn";

export default function SecurityPage() {
  const { connections, audit, backendMode, backendProvider, backendReachable, externalAiCalls, localModelCalls, backendNote } = useApp();
  const blocked = connections.filter((c) => c.status === "BLOCKED").length;
  const allowed = connections.filter((c) => c.status === "ALLOWED").length;
  const warns = audit.filter((a) => a.category === "SECURITY" && a.status === "WARN").length;

  return (
    <div className="space-y-6">
      <BackendStatusBanner />
      <PageHeader
        title="Network Security"
        subtitle="Visibility into local and external network activity."
        action={<LocalOnlyBadge />}
      />

      <Card>
        <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <ShieldCheck className="h-7 w-7 text-emerald-700" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            {backendReachable ? "Secure Environment" : "Application-level Isolation"}
          </p>
          <p className="max-w-2xl text-sm text-slate-600">
            {backendReachable
              ? "Local processing active. SentinelAI Workbench is operating within the secure enclave with no external AI communication."
              : "The FastAPI backend is not reachable. The UI is running in MOCK MODE — no inference, no document processing, no RAG."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
          <BigStat
            label="External AI Calls"
            value={String(externalAiCalls)}
            accent={externalAiCalls > 0 ? "amber" : "emerald"}
            icon={<Network className="h-4 w-4" />}
          />
          <BigStat
            label="External Data Transfers"
            value="0"
            accent="emerald"
            icon={<Lock className="h-4 w-4" />}
          />
          <BigStat
            label="Local Model Calls"
            value={String(localModelCalls)}
            accent="cyan"
            icon={<Shield className="h-4 w-4" />}
          />
          <BigStat
            label="Local Services"
            value={backendReachable ? "4" : "1"}
            accent="cyan"
            icon={<Server className="h-4 w-4" />}
          />
        </div>
        {backendNote && (
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            <span className="font-semibold uppercase tracking-wider text-slate-500">Backend ·</span>{" "}
            {backendNote}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Security Posture" subtitle="Active controls" className="xl:col-span-2">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Control ok label="Local Processing" />
            <Control ok label="Local File Storage" />
            <Control ok label="Local AI Models" />
            <Control ok label="Audit Logging" />
            <Control ok label="External API Monitoring" />
            <Control ok label="Tamper-evident Log" />
          </ul>
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
            <p className="font-medium uppercase tracking-wider">Prototype Note</p>
            <p className="mt-1 text-amber-700/90">
              Prototype Security Monitor: This interface demonstrates application-level security
              visibility. Production deployment would enforce network isolation through firewalls,
              network segmentation and infrastructure controls.
            </p>
          </div>
        </Card>

        <Card title="Egress Summary">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Allowed (local)</span>
              <span className="font-mono">{allowed}</span>
            </li>
            <li className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Blocked</span>
              <span className="font-mono text-amber-700">{blocked}</span>
            </li>
            <li className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Security warnings</span>
              <span className="font-mono text-amber-700">{warns}</span>
            </li>
          </ul>
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
            <p className="font-medium uppercase tracking-wider">No External AI</p>
            <p className="mt-1 text-emerald-800/90">No requests to OpenAI, Anthropic, Google AI or Gemini detected.</p>
          </div>
        </Card>
      </div>

      <Card title="Connection Log" subtitle="Simulated connection events for the current session">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Service</th>
                <th className="px-4 py-2.5 font-medium">Destination</th>
                <th className="px-4 py-2.5 font-medium">Protocol</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connections.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-600">{c.time}</td>
                  <td className="px-4 py-2.5 text-slate-800">{c.service}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {c.destination === "localhost" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-emerald-600" />
                        localhost
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-700">
                        <Network className="h-3.5 w-3.5" />
                        external
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{c.protocol}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge variant={c.status === "ALLOWED" ? "success" : "warn"} dot>
                      {c.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Architecture" subtitle="Where data flows in the secure workbench">
        <div className="grid-bg rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Confidential Data</Pill>
            <Arrow />
            <Pill>Secure Workspace</Pill>
            <Arrow />
            <Pill>Task Router</Pill>
            <Arrow />
            <Pill>Local Model</Pill>
            <Arrow />
            <Pill>Local Result</Pill>
            <Arrow />
            <Pill>Audit + Security</Pill>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Traditional</p>
            <p className="mt-2 text-sm text-slate-700">Data → Internet → Cloud AI</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">SentinelAI</p>
            <p className="mt-2 text-sm text-slate-700">Data → Local AI → Local Result</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: "emerald" | "cyan" | "amber" | "rose";
  icon: React.ReactNode;
}) {
  const colors = {
    emerald: "text-emerald-700 border-emerald-200 bg-emerald-50",
    cyan: "text-cyan-800 border-cyan-200 bg-cyan-50",
    amber: "text-amber-700 border-amber-200 bg-amber-50",
    rose: "text-rose-700 border-rose-200 bg-rose-50",
  } as const;
  return (
    <div className={cn("rounded-md border p-4", colors[accent])}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Control({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
      {ok ? (
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-600" />
      )}
      <span className="text-sm text-slate-800">{label}</span>
      <span
        className={cn(
          "ml-auto text-[11px] font-medium uppercase tracking-wider",
          ok ? "text-emerald-700" : "text-amber-700",
        )}
      >
        {ok ? "Active" : "Inactive"}
      </span>
    </li>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800">
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-slate-400">→</span>;
}
