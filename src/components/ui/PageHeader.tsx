import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {children}
      </div>
    </header>
  );
}
