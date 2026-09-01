"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { StatusBadge, SecurityBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackendStatusBanner } from "@/components/ui/BackendStatusBanner";
import {
  CheckCircle2,
  Shield,
  ShieldCheck,
  FileLock,
  Cpu,
  AlertTriangle,
  Activity,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Code2,
  FilePlus2,
  Network,
  Sparkles,
  Database,
  Server,
} from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  const {
    tasks,
    documents,
    audit,
    activeTaskCount,
    documentsProcessed,
    securityEventCount,
    models,
  } = useApp();

  const recent = tasks.slice(0, 4);
  const readyModels = models.filter((m) => m.status === "READY").length;

  return (
    <div className="space-y-6">
      <BackendStatusBanner />
      <PageHeader
        title="Secure AI Operations Center"
        subtitle="Monitor confidential AI workloads, local models and security status."
      >
        <Link
          href="/new-task"
          className="inline-flex items-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-800"
        >
          <FilePlus2 className="h-4 w-4" />
          New Task
        </Link>
        <Link
          href="/demos"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Sparkles className="h-4 w-4" />
          Run Demo
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Air-Gap Status"
          value={
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" /> SECURE
            </span>
          }
          caption="Local processing active"
          icon={<Shield className="h-4 w-4" />}
          accent="secure"
        />
        <StatCard
          label="Active Tasks"
          value={String(activeTaskCount).padStart(2, "0")}
          caption="Currently executing"
          icon={<Activity className="h-4 w-4" />}
          accent="active"
        />
        <StatCard
          label="Documents Processed"
          value={String(documentsProcessed).padStart(3, "0")}
          caption="In local repository"
          icon={<FileLock className="h-4 w-4" />}
          accent="documents"
        />
        <StatCard
          label="Local AI Models"
          value={`${String(readyModels).padStart(2, "0")} READY`}
          caption="All local capabilities"
          icon={<Cpu className="h-4 w-4" />}
          accent="models"
        />
        <StatCard
          label="Security Events"
          value={String(securityEventCount).padStart(2, "0")}
          caption="Blocked external calls"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent={securityEventCount > 0 ? "events" : "secure"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card
            title="Recent Tasks"
            subtitle="Confidential AI workloads processed by the local workbench"
            action={
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {recent.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Create your first secure AI task."
                icon={<FileText className="h-5 w-5" />}
                action={
                  <Link
                    href="/new-task"
                    className="inline-flex items-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    <FilePlus2 className="h-4 w-4" /> Create task
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((t) => (
                  <RecentTaskRow key={t.id} task={t} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card
          title="Environment Security"
          subtitle="Live status of the secure local workspace"
          action={<LocalOnlyBadge />}
        >
          <div className="space-y-2.5">
            <SecurityLine ok label="Local Processing" />
            <SecurityLine ok label="Local File Storage" />
            <SecurityLine ok label="Local AI Models" />
            <SecurityLine ok label="Audit Logging" />
            <SecurityLine ok label="External API Monitoring" />
          </div>
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Secure Environment
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              All AI processing is performed on local infrastructure. No data leaves the secure
              workspace.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">External Connections</span>
              <span className="text-base font-semibold text-emerald-700">0</span>
            </div>
            <Link
              href="/security"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Shield className="h-4 w-4" /> View Security Details
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          title="Local-First Architecture"
          subtitle="How SentinelAI processes confidential information"
          className="xl:col-span-2"
        >
          <div className="grid-bg rounded-md border border-slate-200 bg-slate-50 p-5">
            <FlowRow
              steps={[
                { label: "Confidential Data", icon: <FileLock className="h-4 w-4" /> },
                { label: "SentinelAI Workbench", icon: <Shield className="h-4 w-4" /> },
                { label: "Task Router", icon: <Network className="h-4 w-4" /> },
                { label: "Local AI Model", icon: <Cpu className="h-4 w-4" /> },
                { label: "Local Tools", icon: <Server className="h-4 w-4" /> },
                { label: "Local Result", icon: <FileText className="h-4 w-4" /> },
                { label: "Audit + Security", icon: <ShieldCheck className="h-4 w-4" /> },
              ]}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                Traditional
              </p>
              <p className="mt-2 text-sm text-slate-700">Data → Internet → Cloud AI</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                SentinelAI
              </p>
              <p className="mt-2 text-sm text-slate-700">Data → Local AI → Local Result</p>
            </div>
          </div>
        </Card>

        <Card title="Audit Snapshot" subtitle="Most recent system events" action={
          <Link
            href="/audit"
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        }>
          {audit.length === 0 ? (
            <EmptyState title="No audit events" />
          ) : (
            <ul className="space-y-3">
              {audit.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 h-2 w-2 flex-none rounded-full",
                      e.status === "SUCCESS" && "bg-emerald-500",
                      e.status === "INFO" && "bg-cyan-600",
                      e.status === "WARN" && "bg-amber-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800">{e.action}</p>
                    <p className="truncate text-[11px] text-slate-500">{e.detail}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card
          title="Local AI Capabilities"
          subtitle="Models available for confidential processing"
          action={
            <Link
              href="/models"
              className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <ul className="space-y-2">
            {models.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded border border-slate-200 bg-slate-50 p-1.5 text-slate-600">
                    {m.id === "Local-Vision-Model" ? (
                      <ImageIcon className="h-3.5 w-3.5" />
                    ) : m.id === "Local-Code-Model" ? (
                      <Code2 className="h-3.5 w-3.5" />
                    ) : m.id === "Local-OCR" ? (
                      <FileText className="h-3.5 w-3.5" />
                    ) : (
                      <Cpu className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.name}</p>
                    <p className="text-[11px] text-slate-500">{m.parameters} · {m.version}</p>
                  </div>
                </div>
                <StatusBadge variant="success" dot>
                  Ready
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Local Repository"
          subtitle="Recently indexed confidential documents"
          action={
            <Link
              href="/documents"
              className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <ul className="space-y-2">
            {documents.slice(0, 5).map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded border border-slate-200 bg-slate-50 p-1.5 text-slate-600">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{d.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {d.type} · {d.extension} · {formatBytes(d.size)}
                    </p>
                  </div>
                </div>
                <LocalOnlyBadge />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function SecurityLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
    </div>
  );
}

function RecentTaskRow({ task }: { task: Task }) {
  const typeIcon =
    task.resolvedType === "Vision Analysis" ? (
      <ImageIcon className="h-3.5 w-3.5" />
    ) : task.resolvedType === "Code Analysis" ? (
      <Code2 className="h-3.5 w-3.5" />
    ) : (
      <FileText className="h-3.5 w-3.5" />
    );

  return (
    <li className="py-3">
      <Link href={`/tasks/${task.id}`} className="flex items-center gap-4">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
          {typeIcon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{task.description}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span>{task.resolvedType}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono">{task.model}</span>
            {task.status === "processing" && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-cyan-700">{task.progress}%</span>
              </>
            )}
          </div>
          {task.status === "processing" && (
            <div className="mt-2">
              <ProgressBar value={task.progress} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge
            variant={task.status === "completed" ? "success" : task.status === "processing" ? "info" : "warn"}
            dot
          >
            {task.status === "completed" ? "Completed" : task.status === "processing" ? "Processing" : "Failed"}
          </StatusBadge>
          <SecurityBadge verified={task.security.verified} />
        </div>
      </Link>
    </li>
  );
}

function FlowRow({ steps }: { steps: { label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
            <span className="text-cyan-700">{s.icon}</span>
            <span className="text-xs font-medium text-slate-800">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
      ))}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
