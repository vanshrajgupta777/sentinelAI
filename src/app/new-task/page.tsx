"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { BackendStatusBanner } from "@/components/ui/BackendStatusBanner";
import {
  FileText,
  Upload,
  X,
  Shield,
  Lock,
  CheckCircle2,
  FilePlus2,
  Cpu,
  Sparkles,
  Image as ImageIcon,
  Code2,
  BarChart3,
  FileBarChart,
  ArrowRight,
} from "lucide-react";
import type { TaskType, UploadedFile } from "@/types";
import { cn } from "@/lib/cn";
import { api } from "@/services/apiClient";

interface FileWithBlob {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  file: File;
}

const typeOptions: {
  id: TaskType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "auto",
    label: "Auto Detect",
    description: "Let the orchestrator classify the task",
    icon: Sparkles,
  },
  {
    id: "document-analysis",
    label: "Document Analysis",
    description: "Inspection, safety, regulatory reports",
    icon: FileText,
  },
  {
    id: "engineering-drawing",
    label: "Engineering Drawing",
    description: "CAD, schematics, technical drawings",
    icon: ImageIcon,
  },
  {
    id: "code-analysis",
    label: "Code Analysis",
    description: "Source code review and security",
    icon: Code2,
  },
  {
    id: "data-analysis",
    label: "Data Analysis",
    description: "Operational and sensor datasets",
    icon: BarChart3,
  },
  {
    id: "report-generation",
    label: "Report Generation",
    description: "Executive briefings and memos",
    icon: FileBarChart,
  },
];

const acceptList = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".dwg", ".zip"];

export default function NewTaskPage() {
  const { submitTask } = useApp();
  const router = useRouter();
  const [description, setDescription] = useState(
    "Analyze this inspection report, identify critical findings, assess operational risks and prepare an approval note.",
  );
  const [type, setType] = useState<TaskType>("auto");
  const [files, setFiles] = useState<FileWithBlob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const next: FileWithBlob[] = [];
    for (const f of arr) {
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "FILE";
      const isAccepted = acceptList.some((a) => f.name.toLowerCase().endsWith(a.replace(".", "")));
      if (!isAccepted) {
        setError(`Unsupported file type: ${f.name}`);
        continue;
      }
      next.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
        extension: ext,
        file: f,
      });
    }
      if (next.length > 0) {
        setFiles((prev: FileWithBlob[]) => [...prev, ...next]);
        setError(null);
      }
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const onSubmit = () => {
    if (running) return;
    if (!description.trim()) {
      setError("Please describe the task before running.");
      return;
    }
    setError(null);
    setRunning(true);
    void (async () => {
      // Upload files to the backend first so it can read them from disk
      // when the orchestrator runs.
      const uploaded: UploadedFile[] = [];
      for (const f of files) {
        const res = await api.uploadDocument(f.file);
        if (res) {
          uploaded.push({
            id: res.document_id,
            name: res.name,
            size: res.size,
            type: f.type,
            extension: res.extension,
          });
        } else {
          // Backend unreachable — pass the client-side metadata.
          uploaded.push({
            id: f.id,
            name: f.name,
            size: f.size,
            type: f.type,
            extension: f.extension,
          });
        }
      }
      const task = await submitTask({ description, type, files: uploaded });
      router.push(`/tasks/${task.id}/execute`);
    })();
  };

  return (
    <div className="space-y-6">
      <BackendStatusBanner />
      <PageHeader
        title="Create New AI Task"
        subtitle="Process confidential information using secure local AI capabilities."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Task Description" subtitle="Describe what you want SentinelAI to do">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want SentinelAI to do..."
              rows={6}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600/30"
            />
            <p className="mt-2 text-xs text-slate-500">
              Tip: be specific about the objective, deliverables and any constraints.
            </p>
          </Card>

          <Card title="Upload Confidential Files" subtitle="Drop files here or browse from your local system">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-slate-50 px-6 py-10 text-center transition-colors",
                dragActive
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-slate-300 hover:border-slate-400",
              )}
              role="button"
              tabIndex={0}
            >
              <div className="rounded-md border border-slate-200 bg-white p-2.5 text-slate-600">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                Drop files here or <span className="text-cyan-700">browse</span>
              </p>
              <p className="text-xs text-slate-500">PDF · DOCX · XLSX · PNG · JPG · DWG · ZIP</p>
              <div className="mt-2 flex items-center gap-2">
                <LocalOnlyBadge />
                <span className="text-xs text-slate-600">
                  Files are processed within the local workspace.
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={acceptList.join(",")}
                onChange={onSelect}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="rounded border border-slate-200 bg-slate-50 p-1.5 text-slate-600">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{f.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {f.extension} · {formatBytes(f.size)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                      aria-label="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <X className="h-3.5 w-3.5" /> {error}
              </div>
            )}
          </Card>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              Files remain on local infrastructure throughout processing.
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={running}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors",
                running
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-cyan-700 text-white hover:bg-cyan-800",
              )}
            >
              {running ? "Submitting..." : "Run Secure AI Task"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Task Type" subtitle="Select the appropriate capability">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {typeOptions.map((opt) => {
                const active = type === opt.id;
                const Icon = opt.icon;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => setType(opt.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-cyan-600 bg-cyan-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 rounded p-1.5",
                          active
                            ? "border border-cyan-200 bg-white text-cyan-700"
                            : "border border-slate-200 bg-slate-50 text-slate-500",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            active ? "text-cyan-900" : "text-slate-800",
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-slate-500">{opt.description}</p>
                      </div>
                      {active && <CheckCircle2 className="mt-1 h-4 w-4 text-cyan-700" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Submission Summary">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Type</span>
                <span className="font-medium">{typeOptions.find((t) => t.id === type)?.label}</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Files</span>
                <span className="font-medium">{files.length}</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Description</span>
                <span className="font-medium">{description.trim().length} chars</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Processing</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Shield className="h-3.5 w-3.5" /> Local
                </span>
              </li>
            </ul>
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Selected Capability</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {type === "engineering-drawing"
                  ? "Local-Vision-Model"
                  : type === "code-analysis"
                  ? "Local-Code-Model"
                  : "Local-General-LLM"}
              </p>
              <div className="mt-2">
                <StatusBadge variant="success" dot>
                  Ready
                </StatusBadge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
