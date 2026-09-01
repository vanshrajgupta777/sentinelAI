"use client";

import { useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  X,
  FileLock,
  Database,
  FileImage,
  FileCode,
  FileSpreadsheet,
  File,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { LocalDocument } from "@/types";

const acceptList = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".dwg", ".zip"];

const typeFilters = ["All", "Inspection Report", "Manual", "Engineering Drawing", "Safety Assessment", "Specification", "Procedure", "Code Archive", "Approval Note"];

export default function DocumentsPage() {
  const { documents, addDocument, removeDocument } = useApp();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q || d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q);
      const matchesT = typeFilter === "All" || d.type === typeFilter;
      return matchesQ && matchesT;
    });
  }, [documents, query, typeFilter]);

  const handleFiles = (list: FileList | File[]) => {
    const arr = Array.from(list);
    let count = 0;
    for (const f of arr) {
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "FILE";
      const isAccepted = acceptList.some((a) => f.name.toLowerCase().endsWith(a.replace(".", "")));
      if (!isAccepted) {
        setError(`Unsupported file type: ${f.name}`);
        continue;
      }
      void addDocument({
        name: f.name,
        type: inferType(f.name),
        extension: ext,
        size: f.size,
        file: f,
      });
      count += 1;
    }
    if (count > 0) setError(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local Document Repository"
        subtitle="Documents stored and processed within the secure local workspace."
        action={<LocalOnlyBadge />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card padded={false}>
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter className="h-4 w-4 text-slate-500" />
                <div className="flex items-center gap-1">
                  {typeFilters.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={cn(
                        "whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider",
                        typeFilter === t
                          ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600/30"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No documents found"
                  description="Try changing the filter or upload a new document."
                  icon={<FileText className="h-5 w-5" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Size</th>
                      <th className="px-4 py-2.5 font-medium">Uploaded</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Security</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((d) => (
                      <DocumentRow key={d.id} doc={d} onRemove={() => removeDocument(d.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Upload Document" subtitle="Add to local repository">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-slate-50 px-4 py-8 text-center transition-colors",
                dragActive ? "border-cyan-500 bg-cyan-50" : "border-slate-300 hover:border-slate-400",
              )}
            >
              <Upload className="h-5 w-5 text-slate-600" />
              <p className="text-sm font-medium text-slate-800">
                Drop files here or <span className="text-cyan-700">browse</span>
              </p>
              <p className="text-xs text-slate-500">PDF · DOCX · XLSX · PNG · JPG · DWG · ZIP</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={acceptList.join(",")}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <X className="h-3.5 w-3.5" /> {error}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Files never leave the local workspace.
            </div>
          </Card>

          <Card title="Repository Stats">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Total documents</span>
                <span className="font-medium">{documents.length}</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Confidential</span>
                <span className="font-medium">
                  {documents.filter((d) => d.classification === "CONFIDENTIAL").length}
                </span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Restricted</span>
                <span className="font-medium">
                  {documents.filter((d) => d.classification === "RESTRICTED").length}
                </span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Total size</span>
                <span className="font-medium">{formatBytes(documents.reduce((s, d) => s + d.size, 0))}</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ doc, onRemove }: { doc: LocalDocument; onRemove: () => void }) {
  const Icon = docIcon(doc);
  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
            <p className="text-[11px] text-slate-500">{doc.owner}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700">{doc.type}</td>
      <td className="px-4 py-3 text-slate-600">{formatBytes(doc.size)}</td>
      <td className="px-4 py-3 text-slate-600">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <StatusBadge variant={doc.status === "INDEXED" ? "success" : "info"} dot>
          {doc.status}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        <LocalOnlyBadge />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
          aria-label="Delete document"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function docIcon(doc: LocalDocument) {
  if (["PNG", "JPG", "JPEG", "DWG"].includes(doc.extension)) return FileImage;
  if (doc.extension === "ZIP") return FileCode;
  if (["XLSX", "CSV"].includes(doc.extension)) return FileSpreadsheet;
  if (["DOCX", "PDF"].includes(doc.extension)) return FileText;
  return File;
}

function inferType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "Inspection Report";
  if (ext === "docx") return "Procedure";
  if (ext === "xlsx") return "Specification";
  if (["png", "jpg", "jpeg", "dwg"].includes(ext ?? "")) return "Engineering Drawing";
  if (ext === "zip") return "Code Archive";
  return "Document";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
