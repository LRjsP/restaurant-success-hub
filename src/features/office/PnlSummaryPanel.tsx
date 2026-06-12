import { cn } from "@/lib/utils";
import { fmtCurrency } from "@/lib/format";

type Row = { label: string; value: number; pct: number; bold?: boolean };

export function PnlSummaryPanel({ rows }: { rows: Row[] }) {
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => (
        <div key={r.label} className={cn("flex items-center justify-between py-2.5 text-sm", r.bold && "font-mono font-semibold text-foreground")}>
          <span className={cn(!r.bold && "text-muted-foreground")}>{r.label}</span>
          <div className="flex items-center gap-4 font-mono tabular-nums">
            <span className={cn("text-[10px]", r.value < 0 ? "text-[var(--color-destructive)]" : "text-muted-foreground")}>
              {r.pct.toFixed(1)}%
            </span>
            <span className={cn("min-w-[100px] text-right", r.value < 0 ? "text-[var(--color-destructive)]" : "text-foreground")}>
              {fmtCurrency(r.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
