"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import {
  Sparkles,
  Play,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Code2,
  ShieldCheck,
  Cpu,
  Network,
  Server,
  Database,
  Lock,
} from "lucide-react";
import { demoScenarios } from "@/data/mockData";
import type { UploadedFile } from "@/types";

const iconFor = (id: string) => {
  if (id === "demo-2") return ImageIcon;
  if (id === "demo-3") return Code2;
  return FileText;
};

export default function DemosPage() {
  const { runDemo } = useApp();
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  const start = (id: string) => {
    const demo = demoScenarios.find((d) => d.id === id);
    if (!demo) return;
    setActive(id);
    setStage("Preparing secure workspace...");
    setProgress(10);
    const steps = [
      "Classifying task...",
      "Selecting local model...",
      "Creating execution plan...",
      "Processing locally...",
      "Generating result...",
      "Verifying security...",
    ];
    let i = 0;
    const tick = () => {
      setProgress((p) => Math.min(95, p + 14));
      setStage(steps[i] ?? "Finalizing...");
      i += 1;
      if (i < steps.length) {
        setTimeout(tick, 500);
      } else {
        setProgress(100);
        setStage("Task completed securely");
        const files: UploadedFile[] = demo.files.map((f, idx) => ({
          id: `demo-${id}-${idx}`,
          name: f.name,
          size: f.size,
          type: f.type,
          extension: f.extension,
        }));
        setTimeout(() => {
          void (async () => {
            const task = await runDemo({
              description: demo.description_prompt,
              type: demo.taskType,
              files,
            });
            router.push(`/tasks/${task.id}/execute`);
          })();
        }, 700);
      }
    };
    setTimeout(tick, 350);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Center"
        subtitle="Preconfigured scenarios for demonstrating SentinelAI."
        action={<LocalOnlyBadge />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {demoScenarios.map((d) => {
          const Icon = iconFor(d.id);
          const isActive = active === d.id;
          return (
            <Card key={d.id} className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-cyan-200 bg-cyan-50 p-2.5 text-cyan-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {d.number}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">{d.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{d.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {d.workflow.map((w, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-slate-700">
                    <span className="rounded border border-slate-200 bg-white px-2 py-0.5">{w}</span>
                    {i < d.workflow.length - 1 && <ArrowRight className="h-3 w-3 text-slate-400" />}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <StatusBadge variant="info">Auto Detect</StatusBadge>
                <span>·</span>
                <span className="font-mono">
                  {d.taskType === "engineering-drawing"
                    ? "Local-Vision-Model"
                    : d.taskType === "code-analysis"
                    ? "Local-Code-Model"
                    : "Local-General-LLM"}
                </span>
              </div>
              <div className="mt-5 flex-1" />
              <button
                type="button"
                onClick={() => start(d.id)}
                disabled={active !== null}
                className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active !== null
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-cyan-700 text-white hover:bg-cyan-800"
                }`}
              >
                <Play className="h-4 w-4" /> Run Demo
              </button>
              {isActive && (
                <div className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-900">
                  <div className="flex items-center justify-between">
                    <span>{stage}</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card title="Local-First Architecture" subtitle="Data never leaves the secure workspace">
        <div className="grid-bg rounded-md border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Step icon={<Lock className="h-3.5 w-3.5" />} label="Confidential Data" />
            <Arrow />
            <Step icon={<ShieldCheck className="h-3.5 w-3.5" />} label="SentinelAI Workbench" />
            <Arrow />
            <Step icon={<Network className="h-3.5 w-3.5" />} label="Task Router" />
            <Arrow />
            <Step icon={<Cpu className="h-3.5 w-3.5" />} label="Local AI Model" />
            <Arrow />
            <Step icon={<Server className="h-3.5 w-3.5" />} label="Local Tools" />
            <Arrow />
            <Step icon={<Database className="h-3.5 w-3.5" />} label="Local Result" />
            <Arrow />
            <Step icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Audit + Security" />
          </div>
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

      <Card title="Demo Flow" subtitle="What the judges will see">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Dashboard overview",
            "Start new task or pick a demo",
            "Upload confidential file",
            "Run Secure AI Task",
            "Watch execution pipeline",
            "Review result + download approval note",
          ].map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-[11px] font-semibold text-cyan-800">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Step({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
      <span className="text-cyan-700">{icon}</span>
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-slate-400">→</span>;
}
