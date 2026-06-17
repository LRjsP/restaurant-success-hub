import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRouteApi } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const layoutApi = getRouteApi("/_authenticated");

function useCompareEnabled() {
  try {
    const s = layoutApi.useSearch() as { compare?: boolean };
    return s?.compare ?? true;
  } catch {
    return true;
  }
}

interface KpiTileProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  variant?: "default" | "warning" | "danger" | "success";
  large?: boolean;
  tooltip?: string;
}

export function KpiTile({ label, value, delta, deltaLabel, hint, variant = "default", large, tooltip }: KpiTileProps) {
  const compareEnabled = useCompareEnabled();
  const showDelta = compareEnabled && delta !== undefined;
  const deltaColor = !showDelta ? "" :
    delta! > 0.5 ? "text-[var(--color-success)]" :
    delta! < -0.5 ? "text-[var(--color-destructive)]" :
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
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
          {tooltip && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${label}`}
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <InfoTooltipContent>{tooltip}</InfoTooltipContent>
            </Tooltip>
          )}
        </div>
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

export function InfoTooltipContent({ children }: { children: React.ReactNode }) {
  return (
    <TooltipContent
      side="top"
      className="max-w-[260px] rounded-md border border-border bg-popover px-3 py-2 text-[11px] leading-snug text-popover-foreground shadow-md"
    >
      {children}
    </TooltipContent>
  );
}

export function PanelInfo({ tooltip }: { tooltip: string }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <InfoTooltipContent>{tooltip}</InfoTooltipContent>
    </Tooltip>
  );
}

export function Panel({ title, subtitle, children, className, action, tooltip }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-foreground">{title}</h3>
            {tooltip && <PanelInfo tooltip={tooltip} />}
          </div>
          {subtitle && <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
