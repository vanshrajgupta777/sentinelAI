"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, SecurityBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Download,
  Copy,
  FilePlus2,
  Shield,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/cn";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tasks, submitTask, audit } = useApp();
  const router = useRouter();
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);
  const [copied, setCopied] = useState(false);

  if (!task) {
    return (
      <div className="space-y-6">
        <PageHeader title="Task Details" />
        <Card>
          <p className="text-sm text-slate-600">Task not found.</p>
          <Link href="/tasks" className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
          </Link>
        </Card>
      </div>
    );
  }

  const taskAudit = audit.filter((a) => a.taskId === task.id);

  const onDownload = () => {
    if (!task.result?.approvalNote) return;
    const content = buildApprovalNoteText(task);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${task.id}-approval-note.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onDownloadJson = () => {
    const payload = {
      taskId: task.id,
      description: task.description,
      model: task.model,
      result: task.result,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${task.id}-result.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onCopy = async () => {
    if (!task.result?.approvalNote) return;
    try {
      await navigator.clipboard.writeText(buildApprovalNoteText(task));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const onFollowUp = () => {
    const newTask = submitTask({
      description: `Follow-up: review corrective actions for ${task.resolvedType.toLowerCase()} task ${task.id}`,
      type: "report-generation",
      files: [],
    });
    router.push(`/tasks/${newTask.id}/execute`);
  };

  const failed = task.status === "failed";

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.status === "completed" ? "Task Completed" : "Task Details"}
        subtitle={task.status === "completed" ? "Secure processing completed" : `Task ${task.id}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge
              variant={task.status === "completed" ? "success" : task.status === "processing" ? "info" : "warn"}
              dot
            >
              {task.status === "completed" ? "Completed" : task.status === "processing" ? "Processing" : "Failed"}
            </StatusBadge>
            <SecurityBadge verified={task.security.verified} />
          </div>
        }
      >
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </PageHeader>

      {failed && (
        <Card>
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Task processing failed</p>
          </div>
        </Card>
      )}

      {task.status === "processing" && (
        <Card>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 animate-pulse text-cyan-700" />
            <p className="text-sm text-slate-800">Task is currently processing</p>
            <Link
              href={`/tasks/${task.id}/execute`}
              className="ml-auto text-sm text-cyan-700 hover:text-cyan-800"
            >
              View execution →
            </Link>
          </div>
          <div className="mt-3">
            <ProgressBar value={task.progress} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Task Information">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Description" value={task.description} wide />
              <Field label="Task ID" value={task.id} mono />
              <Field label="Type" value={task.resolvedType} />
              <Field label="Model" value={task.model} mono />
              <Field label="Status" value={task.status.toUpperCase()} />
              <Field
                label="Created"
                value={new Date(task.createdAt).toLocaleString()}
              />
              {task.completedAt && (
                <Field
                  label="Completed"
                  value={new Date(task.completedAt).toLocaleString()}
                />
              )}
              {task.durationMs && (
                <Field
                  label="Duration"
                  value={`${(task.durationMs / 1000).toFixed(1)}s`}
                />
              )}
            </dl>
            {task.files.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Files</p>
                <ul className="mt-2 space-y-2">
                  {task.files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{f.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {f.extension} · {formatBytes(f.size)}
                        </p>
                      </div>
                      <LocalOnlyBadge />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="Execution Plan" subtitle="Steps performed by the local model">
            <ol className="space-y-2">
              {task.plan.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                    {p.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{p.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{p.description}</p>
                  </div>
                  <span className="hidden text-[11px] text-slate-500 md:inline">{p.tool}</span>
                  <StatusBadge
                    variant={p.status === "complete" ? "success" : p.status === "active" ? "info" : "muted"}
                    dot
                  >
                    {p.status === "complete" ? "Done" : p.status === "active" ? "Running" : "Waiting"}
                  </StatusBadge>
                </li>
              ))}
            </ol>
          </Card>

          {task.result && (
            <Card title="Result" subtitle="Generated by the local AI capability">
              <ResultSection task={task} />
            </Card>
          )}

          {task.result?.approvalNote && (
            <Card
              title="Generated Approval Note"
              subtitle="Management-ready document generated locally"
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-800"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={onFollowUp}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" /> Follow-up Task
                  </button>
                </div>
              }
            >
              <ApprovalNoteView note={task.result.approvalNote} />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Execution Timeline">
            <ul className="space-y-3">
              {taskAudit.length === 0 ? (
                <p className="text-xs text-slate-500">No audit events for this task yet.</p>
              ) : (
                taskAudit.map((e) => (
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
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card title="Security" action={<LocalOnlyBadge />}>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> No external AI communication
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Local processing only
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Files stored locally
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Audit events recorded
              </li>
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> Verified by Security Module
            </div>
          </Card>

          {task.result && (
            <Card title="Export">
              <div className="grid grid-cols-1 gap-2">
                {task.result.approvalNote && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-800"
                  >
                    <Download className="h-4 w-4" /> Download Approval Note
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDownloadJson}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Download Result (JSON)
                </button>
                <button
                  type="button"
                  onClick={onFollowUp}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <FilePlus2 className="h-4 w-4" /> Create Follow-up Task
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={cn("mt-1 text-sm text-slate-800", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function ResultSection({ task }: { task: Task }) {
  if (!task.result) return null;
  const r = task.result;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Summary</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">{r.summary}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Risk Level</p>
        <div className="mt-1">
          <StatusBadge
            variant={r.riskLevel === "HIGH" ? "danger" : r.riskLevel === "MEDIUM" ? "warn" : "success"}
            dot
          >
            {r.riskLevel}
          </StatusBadge>
        </div>
      </div>

      {r.findings.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Critical Findings</p>
          <ul className="mt-2 space-y-2">
            {r.findings.map((f) => (
              <li
                key={f.id}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">{f.title}</p>
                  <StatusBadge
                    variant={f.severity === "HIGH" ? "danger" : f.severity === "MEDIUM" ? "warn" : "info"}
                    dot
                  >
                    {f.severity}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-slate-600">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.recommendations.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Recommended Actions</p>
          <ol className="mt-2 space-y-1.5 text-sm text-slate-800">
            {r.recommendations.map((rec, i) => (
              <li key={rec.id} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-[10px] text-cyan-800">
                  {i + 1}
                </span>
                <span>{rec.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {r.drawing && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Drawing Analysis</p>
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Drawing No.: <span className="font-mono text-slate-800">{r.drawing.drawingNumber}</span>
              </span>
              <span>{r.drawing.title}</span>
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Dimensions
            </p>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  {r.drawing.dimensions.map((d, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-slate-500">{d.label}</td>
                      <td className="py-1.5 text-right font-mono text-slate-800">{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Components
            </p>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  {r.drawing.components.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5 text-slate-500">{c.name}</td>
                      <td className="py-1.5 text-right font-mono text-slate-800">×{c.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.drawing.observations.length > 0 && (
              <>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Observations
                </p>
                <ul className="mt-1 list-disc pl-5 text-xs text-slate-700">
                  {r.drawing.observations.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {r.code && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Code Review</p>
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">
              Language: <span className="text-slate-800">{r.code.language}</span> · Files reviewed:{" "}
              <span className="text-slate-800">{r.code.filesReviewed}</span>
            </p>
            <p className="mt-1 text-xs text-slate-700">{r.code.summary}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-1.5 text-left font-medium">Issue</th>
                    <th className="py-1.5 text-left font-medium">Severity</th>
                    <th className="py-1.5 text-left font-medium">Location</th>
                    <th className="py-1.5 text-left font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.code.issues.map((i) => (
                    <tr key={i.id}>
                      <td className="py-1.5 text-slate-800">{i.title}</td>
                      <td className="py-1.5">
                        <StatusBadge
                          variant={i.severity === "HIGH" ? "danger" : i.severity === "MEDIUM" ? "warn" : "info"}
                          dot
                        >
                          {i.severity}
                        </StatusBadge>
                      </td>
                      <td className="py-1.5 font-mono text-slate-500">{i.description}</td>
                      <td className="py-1.5 text-slate-700">{i.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalNoteView({ note }: { note: NonNullable<NonNullable<Task["result"]>["approvalNote"]> }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-800">
      <header className="border-b border-slate-200 pb-3">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Approval Note</p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">{note.subject}</h3>
        <p className="mt-1 text-xs text-slate-500">
          Generated by SentinelAI Workbench · Local processing
        </p>
      </header>
      <section className="mt-4 space-y-4">
        <Section title="Executive Summary" body={note.executiveSummary} />
        <Section title="Inspection Findings" body={note.inspectionFindings} multiline />
        <Section title="Risk Assessment" body={note.riskAssessment} />
        <Section title="Recommended Actions" body={note.recommendedActions} multiline />
        <Section title="Approval Recommendation" body={note.approvalRecommendation} />
      </section>
    </div>
  );
}

function Section({ title, body, multiline }: { title: string; body: string; multiline?: boolean }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      <p
        className={cn(
          "mt-1 text-sm text-slate-800",
          multiline ? "whitespace-pre-line" : "",
        )}
      >
        {body}
      </p>
    </div>
  );
}

function buildApprovalNoteText(task: Task): string {
  const note = task.result?.approvalNote;
  if (!note) return "";
  return [
    `SENTINELAI WORKBENCH — APPROVAL NOTE`,
    `Generated locally · ${new Date().toISOString()}`,
    ``,
    `Task ID: ${task.id}`,
    `Description: ${task.description}`,
    `Model: ${task.model}`,
    ``,
    `SUBJECT`,
    note.subject,
    ``,
    `EXECUTIVE SUMMARY`,
    note.executiveSummary,
    ``,
    `INSPECTION FINDINGS`,
    note.inspectionFindings,
    ``,
    `RISK ASSESSMENT`,
    note.riskAssessment,
    ``,
    `RECOMMENDED ACTIONS`,
    note.recommendedActions,
    ``,
    `APPROVAL RECOMMENDATION`,
    note.approvalRecommendation,
    ``,
    `— end of note —`,
  ].join("\n");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
