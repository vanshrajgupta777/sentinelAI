"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge, SecurityBadge, LocalOnlyBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilePlus2, Search, Filter, FileText, Image as ImageIcon, Code2, BarChart3, FileBarChart, ChevronRight } from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/cn";

const filters = ["All", "Processing", "Completed", "Failed"] as const;
type Filter = (typeof filters)[number];

export default function TasksPage() {
  const { tasks } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Processing" && t.status === "processing") ||
        (filter === "Completed" && t.status === "completed") ||
        (filter === "Failed" && t.status === "failed");
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.resolvedType.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [tasks, filter, query]);

  const counts = {
    all: tasks.length,
    processing: tasks.filter((t) => t.status === "processing").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Tasks"
        subtitle="History of confidential AI workloads and their execution status."
        action={
          <Link
            href="/new-task"
            className="inline-flex items-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-800"
          >
            <FilePlus2 className="h-4 w-4" /> New Task
          </Link>
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <div className="flex flex-wrap items-center gap-1">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider",
                    filter === f
                      ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  {f} <span className="ml-1 text-[10px] text-slate-500">{counts[f.toLowerCase() as keyof typeof counts]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600/30"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No tasks yet"
              description="Create your first secure AI task to begin processing confidential information."
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Task</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Model</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5 font-medium">Security</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const TypeIcon =
    task.resolvedType === "Vision Analysis"
      ? ImageIcon
      : task.resolvedType === "Code Analysis"
      ? Code2
      : task.resolvedType === "Data Analysis"
      ? BarChart3
      : task.resolvedType === "Report Generation"
      ? FileBarChart
      : FileText;

  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <Link href={`/tasks/${task.id}`} className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{task.description}</p>
            <p className="text-[11px] text-slate-500">{task.id}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-slate-700">{task.resolvedType}</td>
      <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{task.model}</td>
      <td className="px-4 py-3">
        <StatusBadge
          variant={task.status === "completed" ? "success" : task.status === "processing" ? "info" : "warn"}
          dot
        >
          {task.status === "completed" ? "Completed" : task.status === "processing" ? "Processing" : "Failed"}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 text-slate-600">{formatDate(task.createdAt)}</td>
      <td className="px-4 py-3">
        <SecurityBadge verified={task.security.verified} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800"
        >
          Open <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
