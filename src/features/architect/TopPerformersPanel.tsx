import { cn } from "@/lib/utils";
import { fmtCurrency } from "@/lib/format";
import type { MenuItem } from "@/lib/dashboard-types";
import { CLASS_COLOR } from "./utils";

export function TopPerformersPanel({ items }: { items: MenuItem[] }) {
  return (
    <div className="divide-y divide-border">
      {items.slice(0, 8).map((i) => (
        <div key={i.name} className="flex items-center justify-between py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{i.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {i.category} · {i.sold} sold
            </p>
          </div>
          <div className="text-right font-mono tabular-nums">
            <p className="text-sm text-foreground">{fmtCurrency(i.margin)}</p>
            <span
              className={cn("inline-block rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wider")}
              style={{ backgroundColor: `color-mix(in oklab, ${CLASS_COLOR[i.classification]} 18%, transparent)`, color: CLASS_COLOR[i.classification] }}
            >
              {i.classification}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
