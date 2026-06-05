import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  variant?: "default" | "warning" | "danger" | "success";
  large?: boolean;
}

export function KpiTile({ label, value, delta, deltaLabel, hint, variant = "default", large }: KpiTileProps) {
  const deltaColor = delta === undefined ? "" :
    delta > 0.5 ? "text-[var(--color-success)]" :
    delta < -0.5 ? "text-[var(--color-destructive)]" :
    "text-muted-foreground";

  const accentBar = {
    default: "bg-accent/60",
    warning: "bg-[var(--color-warning)]",
    danger: "bg-[var(--color-destructive)]",
    success: "bg-[var(--color-success)]",
  }[variant];

  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-card p-5 transition-colors hover:border-border/70">
      <div className={cn("absolute left-0 top-0 h-full w-[2px]", accentBar)} />
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        {delta !== undefined && (
          <span className={cn("font-mono text-[10px] tabular-nums", deltaColor)}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className={cn("font-mono font-bold tabular-nums tracking-tight text-foreground", large ? "text-4xl" : "text-3xl")}>
        {value}
      </div>
      {(hint || deltaLabel) && (
        <div className="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
          <span>{hint}</span>
          <span>{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}

export function Panel({ title, subtitle, children, className, action }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
