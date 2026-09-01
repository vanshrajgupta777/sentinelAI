import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  caption,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon?: ReactNode;
  accent?: "neutral" | "secure" | "active" | "documents" | "models" | "events";
}) {
  const accentMap = {
    neutral: "text-slate-700",
    secure: "text-emerald-700",
    active: "text-amber-700",
    documents: "text-cyan-800",
    models: "text-indigo-700",
    events: "text-rose-700",
  } as const;

  const iconBg: Record<typeof accent, string> = {
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    secure: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-amber-50 text-amber-700 border-amber-200",
    documents: "bg-cyan-50 text-cyan-700 border-cyan-200",
    models: "bg-indigo-50 text-indigo-700 border-indigo-200",
    events: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;

  return (
    <Card padded={false} className="bg-white">
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className={cn("mt-3 text-3xl font-semibold tabular-nums", accentMap[accent])}>{value}</p>
          {caption && <p className="mt-2 text-xs text-slate-500">{caption}</p>}
        </div>
        {icon && <div className={cn("rounded-md border p-2", iconBg[accent])}>{icon}</div>}
      </div>
    </Card>
  );
}
