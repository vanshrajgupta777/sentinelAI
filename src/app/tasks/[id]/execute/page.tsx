"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, SecurityBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircle2, Circle, Loader2, Shield, FileText, Cpu, ArrowRight, Clock } from "lucide-react";
import type { PipelineStep } from "@/types";
import { cn } from "@/lib/cn";

export default function ExecuteTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks } = useApp();
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  useEffect(() => {
    if (task && task.status === "completed") {
      const t = setTimeout(() => {
        router.replace(`/tasks/${task.id}`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [task, router]);

  if (!task) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Task Execution" />
        <Card>
          <p className="text-sm text-slate-600">Task not found.</p>
          <Link
            href="/tasks"
            className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-700"
          >
            Back to tasks
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Task Execution"
        subtitle="Secure local workflow with audit and verification"
        action={
          <SecurityBadge verified={task.security.verified} />
        }
      >
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <ArrowRight className="h-4 w-4" /> View Result
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Execution Pipeline" subtitle="Sequential stages of the secure workflow">
            <ol className="space-y-2.5">
              {task.pipeline.map((p) => (
                <PipelineRow key={p.id} step={p} />
              ))}
            </ol>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
                  <p className="text-sm font-medium text-slate-800">{task.currentStage ?? "Initializing"}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-cyan-700">{task.progress}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{task.statusMessage ?? "Preparing secure workspace..."}</p>
              <div className="mt-3">
                <ProgressBar value={task.progress} accent={task.status === "completed" ? "success" : "primary"} />
              </div>
            </div>
          </Card>

          <Card title="Execution Plan" subtitle="Local model tools invoked for this task">
            <ol className="space-y-2">
              {task.plan.map((step) => (
                <li
                  key={step.id}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                    {step.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{step.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{step.description}</p>
                  </div>
                  <span className="hidden text-[11px] text-slate-500 md:inline">{step.tool}</span>
                  <StatusBadge
                    variant={
                      step.status === "complete" ? "success" : step.status === "active" ? "info" : "muted"
                    }
                    dot
                  >
                    {step.status === "complete" ? "Done" : step.status === "active" ? "Running" : "Waiting"}
                  </StatusBadge>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Task Information">
            <ul className="space-y-3 text-sm">
              <li>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Description</p>
                <p className="mt-1 text-slate-800">{task.description}</p>
              </li>
              <li>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Task ID</p>
                <p className="mt-1 font-mono text-slate-800">{task.id}</p>
              </li>
              <li>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Type</p>
                <p className="mt-1 text-slate-800">{task.resolvedType}</p>
              </li>
              <li>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Files</p>
                <ul className="mt-1 space-y-1">
                  {task.files.length === 0 && <li className="text-slate-500">No files</li>}
                  {task.files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-slate-700">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span className="truncate">{f.name}</span>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </Card>

          <Card title="Selected Local Model" action={<StatusBadge variant="success" dot>Ready</StatusBadge>}>
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-cyan-700">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{task.model}</p>
                <p className="text-[11px] text-slate-500">Local target capability</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Capability text="Document analysis" />
              <Capability text="Summarization" />
              <Capability text="Reasoning" />
              <Capability text="Report generation" />
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Note: V1 simulates local inference. Production deployment uses on-premise models.
            </p>
          </Card>

          <Card title="Security" action={<SecurityBadge verified={task.security.verified} />}>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> No external AI communication
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Files stored locally
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Audit events recorded
              </li>
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> All processing on local infrastructure
            </div>
          </Card>

          <Card title="Timing">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4 text-slate-500" />
              Started {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            {task.completedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Completed {new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ step }: { step: PipelineStep }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
        step.status === "active"
          ? "border-cyan-300 bg-cyan-50"
          : step.status === "complete"
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white",
      )}
    >
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
        {step.index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{step.title}</p>
        <p className="truncate text-[11px] text-slate-500">{step.description}</p>
      </div>
      {step.status === "complete" ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : step.status === "active" ? (
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
      ) : (
        <Circle className="h-4 w-4 text-slate-300" />
      )}
    </li>
  );
}

function Capability({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700">
      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-700" /> {text}
    </div>
  );
}
