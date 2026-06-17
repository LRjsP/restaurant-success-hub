import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getHeatmapData } from "@/lib/dashboard.functions";
import { getRouteApi } from "@tanstack/react-router";
import { getDateRange, fmtCurrency, fmtNumber } from "@/lib/format";
import { HEATMAP_DAYS, HEATMAP_HOURS, type HeatmapCell } from "@/lib/dashboard-types";
import { cn } from "@/lib/utils";

type Metric = "covers" | "netSales";

function formatHour(h: number) {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

const layoutApi = getRouteApi("/_authenticated");

export function DayTimeHeatmap({
  center,
  defaultMetric = "covers",
}: {
  center: string;
  defaultMetric?: Metric;
}) {
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const search = layoutApi.useSearch();
  const fn = useServerFn(getHeatmapData);
  const range = getDateRange(search.range);
  const { data } = useQuery({
    queryKey: ["heatmap", range, center],
    queryFn: () => fn({ data: { from: range.from, to: range.to, center } }),
  });
  const cells = (data ?? []) as HeatmapCell[];
  const max = useMemo(
    () => Math.max(1, ...cells.map((c) => (metric === "covers" ? c.covers : c.netSales))),
    [cells, metric],
  );

  const grid: Record<string, HeatmapCell> = {};
  for (const c of cells) grid[`${c.day}-${c.hour}`] = c;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {metric === "covers" ? "Covers per hour" : "Net sales per hour"}
        </p>
        <div className="inline-flex items-center rounded-sm border border-border bg-card p-0.5">
          {(["covers", "netSales"] as const).map((m) => (
            <Tooltip key={m} delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setMetric(m)}
                  className={cn(
                    "px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                    metric === m
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "covers" ? "Covers" : "Sales"}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-md"
              >
                {m === "covers"
                  ? "Guest count — how many diners were served per day and hour slot."
                  : "Net sales — revenue generated per day and hour slot."}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `36px repeat(${HEATMAP_HOURS.length}, minmax(28px, 1fr))`,
          }}
        >
          <div />
          {HEATMAP_HOURS.map((h) => (
            <div
              key={`h-${h}`}
              className="text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
            >
              {formatHour(h)}
            </div>
          ))}

          {HEATMAP_DAYS.map((dLabel, day) => (
            <FragmentRow key={day} dLabel={dLabel}>
              {HEATMAP_HOURS.map((hour) => {
                const cell = grid[`${day}-${hour}`] ?? { day, hour, covers: 0, netSales: 0 };
                const value = metric === "covers" ? cell.covers : cell.netSales;
                const intensity = value / max;
                const alpha = value === 0 ? 0.04 : 0.08 + intensity * 0.87;
                return (
                  <Tooltip key={`${day}-${hour}`} delayDuration={80}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-7 cursor-pointer rounded-sm border border-border/30 transition-transform hover:scale-110 hover:border-accent"
                        style={{
                          backgroundColor: `color-mix(in oklab, var(--color-chart-1) ${(alpha * 100).toFixed(0)}%, transparent)`,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-md"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {dLabel} · {formatHour(hour)}
                      </p>
                      <p className="mt-0.5 font-mono tabular-nums">
                        {metric === "covers"
                          ? `${fmtNumber(cell.covers)} covers`
                          : fmtCurrency(cell.netSales)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </FragmentRow>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Low</span>
        <div className="flex h-2 w-32 overflow-hidden rounded-sm">
          {[0.08, 0.25, 0.45, 0.65, 0.85, 0.95].map((a) => (
            <div
              key={a}
              className="flex-1"
              style={{
                backgroundColor: `color-mix(in oklab, var(--color-chart-1) ${(a * 100).toFixed(0)}%, transparent)`,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">High</span>
      </div>
    </div>
  );
}

function FragmentRow({ dLabel, children }: { dLabel: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {dLabel}
      </div>
      {children}
    </>
  );
}
