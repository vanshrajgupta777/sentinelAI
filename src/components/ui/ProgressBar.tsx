import { cn } from "@/lib/cn";

export function ProgressBar({ value, accent = "primary" }: { value: number; accent?: "primary" | "success" }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          accent === "primary" ? "bg-cyan-600" : "bg-emerald-500",
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
