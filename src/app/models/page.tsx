"use client";

import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { BackendStatusBanner } from "@/components/ui/BackendStatusBanner";
import { Cpu, CheckCircle2, Code2, FileText, Image as ImageIcon, Database, Activity, HardDrive, AlertCircle } from "lucide-react";

const modelIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  "Local-General-LLM": FileText,
  "Local-Vision-Model": ImageIcon,
  "Local-Code-Model": Code2,
  "Local-OCR": Database,
};

export default function ModelsPage() {
  const { models, backendProvider, backendReachable, backendMode } = useApp();
  return (
    <div className="space-y-6">
      <BackendStatusBanner />
      <PageHeader
        title="Local AI Capabilities"
        subtitle={
          backendReachable
            ? `Backend: ${backendProvider} (${backendMode}). Status below reflects actual health checks.`
            : "Backend is not reachable. Status is illustrative — start FastAPI to see real availability."
        }
        action={<LocalOnlyBadge />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {models.map((m) => {
          const Icon = modelIcon[m.id] ?? Cpu;
          const isReady = m.status === "READY";
          return (
            <Card key={m.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md border border-cyan-200 bg-cyan-50 p-2.5 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{m.name}</h3>
                    <p className="text-xs text-slate-500">
                      {m.parameters} · {m.version}
                    </p>
                  </div>
                </div>
                <StatusBadge variant={isReady ? "success" : "warn"} dot>
                  {isReady ? "Ready" : "Not Configured"}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm text-slate-600">{m.description}</p>
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Capabilities
                </p>
                <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {m.capabilities.map((c) => (
                    <li
                      key={c}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-700" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                <Stat label="Local" value={<LocalOnlyBadge />} />
                <Stat label="Latency" value="120 ms" />
                <Stat label="Throughput" value="42 t/s" />
              </div>
              <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500">
                V1 simulates local inference. Production deployment runs these models on
                on-premise GPU servers within the secure enclave.
              </p>
            </Card>
          );
        })}
      </div>

      <Card title="Inference Infrastructure" subtitle="Local hardware stack">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfraLine label="AI Engine" value="Local inference cluster" icon={<Cpu className="h-4 w-4" />} />
          <InfraLine label="Vector Store" value="Local embeddings" icon={<Database className="h-4 w-4" />} />
          <InfraLine label="Object Store" value="Local document repository" icon={<HardDrive className="h-4 w-4" />} />
          <InfraLine label="Audit Logger" value="Tamper-evident log" icon={<Activity className="h-4 w-4" />} />
          <InfraLine label="Security Module" value="Egress monitor" icon={<CheckCircle2 className="h-4 w-4" />} />
          <InfraLine label="Network" value="Air-gapped" icon={<HardDrive className="h-4 w-4" />} />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 text-slate-800">{value}</div>
    </div>
  );
}

function InfraLine({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <div className="rounded border border-slate-200 bg-slate-50 p-1.5 text-slate-600">{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{value}</p>
      </div>
    </div>
  );
}
