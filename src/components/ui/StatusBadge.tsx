import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "neutral" | "success" | "warn" | "danger" | "info" | "muted";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-cyan-50 text-cyan-800 border-cyan-200",
  muted: "bg-slate-50 text-slate-500 border-slate-200",
};

const dotClasses: Record<Variant, string> = {
  neutral: "bg-slate-500",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-cyan-600",
  muted: "bg-slate-400",
};

export function StatusBadge({
  children,
  variant = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dotClasses[variant])} />}
      {children}
    </span>
  );
}

export function SecurityBadge({ verified = true }: { verified?: boolean }) {
  return (
    <StatusBadge variant={verified ? "success" : "warn"} dot>
      {verified ? "Secure" : "Verifying"}
    </StatusBadge>
  );
}

export function LocalOnlyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-cyan-800">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-600" />
      Local Only
    </span>
  );
}
