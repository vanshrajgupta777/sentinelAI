import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      {icon && <div className="mb-4 rounded-md border border-slate-200 bg-white p-3 text-slate-500">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="space-y-3">
      <div className="shimmer h-4 w-1/3 rounded" />
      <div className="shimmer h-4 w-2/3 rounded" />
      <div className="shimmer h-4 w-1/2 rounded" />
      <p className="pt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
