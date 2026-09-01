"use client";

import { useApp } from "@/components/providers/AppProvider";
import { Cpu, ShieldOff, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Small banner that surfaces whether the app is connected to the
 * real FastAPI backend or running in clearly-labelled MOCK MODE.
 */
export function BackendStatusBanner({ className }: { className?: string }) {
  const { backendMode, backendProvider, backendReachable, backendNote, refreshBackend } = useApp();
  if (backendReachable && backendMode === "REAL_LOCAL") return null;

  const isMock = !backendReachable || backendMode === "MOCK";
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-xs",
        isMock
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-cyan-200 bg-cyan-50 text-cyan-800",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isMock ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" />
        )}
        <span className="font-semibold uppercase tracking-wider">
          {isMock ? "MOCK MODE" : `${backendMode} MODE`}
        </span>
        <span className="text-[11px] opacity-80">· {backendProvider}</span>
        <button
          type="button"
          onClick={() => void refreshBackend()}
          className="ml-auto inline-flex items-center gap-1 rounded border border-current/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider hover:bg-white/40"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
      {backendNote && <p className="mt-1 leading-relaxed text-[11px] opacity-90">{backendNote}</p>}
    </div>
  );
}

export function BackendStatusPill() {
  const { backendMode, backendProvider, backendReachable } = useApp();
  const ok = backendReachable && backendMode === "REAL_LOCAL";
  const partial = backendReachable && backendMode !== "REAL_LOCAL";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider",
        ok && "border-emerald-200 bg-emerald-50 text-emerald-700",
        partial && "border-cyan-200 bg-cyan-50 text-cyan-800",
        !backendReachable && "border-amber-200 bg-amber-50 text-amber-700",
      )}
      title={`Backend: ${backendProvider} (${backendMode})`}
    >
      {ok ? (
        <ShieldCheck className="h-3 w-3" />
      ) : partial ? (
        <Cpu className="h-3 w-3" />
      ) : (
        <ShieldOff className="h-3 w-3" />
      )}
      <span>
        {!backendReachable ? "Mock" : backendMode === "REAL_LOCAL" ? "Real Local" : "Local Mock"}
      </span>
    </div>
  );
}
