import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardProps = {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
};

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  padded = true,
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export function CardSubtle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border border-slate-200 bg-slate-50 p-4", className)}>
      {children}
    </div>
  );
}
