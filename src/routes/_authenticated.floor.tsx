import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { DayTimeHeatmap } from "@/components/dashboard/Heatmap";
import {
  generateDemoDays,
  computeFloorKpis,
  demoAlerts,
  daysForPreset,
} from "@/lib/demo-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowRight, X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtCurrency, fmtNumber } from "@/lib/format";

const HINT_KEY = "mise_floor_hint_dismissed";
const layoutApi = getRouteApi("/_authenticated");

export const Route = createFileRoute("/_authenticated/floor")({
  component: FloorPage,
});

function FloorPage() {
  const search = layoutApi.useSearch();
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(HINT_KEY);
    if (!dismissed) setHintVisible(true);
  }, []);

  const dismissHint = () => {
    setHintVisible(false);
    localStorage.setItem(HINT_KEY, "1");
  };

  const days = generateDemoDays(daysForPreset(search.range), search.center);
  const prev = generateDemoDays(daysForPreset(search.range), search.center, daysForPreset(search.range));
  const kpis = computeFloorKpis(days, prev);

  return (
    <div className="space-y-6">
      {/* Onboarding hint */}
      {hintVisible && (
        <div className="relative overflow-hidden rounded-md border border-accent/30 bg-accent/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <ArrowRight className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Need deeper analytics?
                </p>
                <p className="text-xs text-muted-foreground">
                  Open{" "}
                  <Link
                    to="/office"
                    search={(prev: any) => prev}
                    className="inline-flex items-center gap-0.5 font-medium text-accent underline underline-offset-2 hover:text-accent/80"
                  >
                    The Office <ArrowRight className="h-3 w-3" />
                  </Link>{" "}
                  for P&L, labor, and cost breakdowns.
                </p>
              </div>
            </div>
            <button
              onClick={dismissHint}
              className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss hint"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          label="Net Sales"
          value={fmtCurrency(kpis.netSales, { maximumFractionDigits: 0 })}
          delta={kpis.netSalesDelta}
          deltaLabel="vs previous"
          variant={kpis.netSalesDelta >= 0 ? "success" : "danger"}
          tooltip="Total revenue from food and beverage after discounts and comps. The headline number for how much money came in during the period."
        />
        <KpiTile
          label="Covers"
          value={fmtNumber(kpis.covers)}
          delta={kpis.coversDelta}
          deltaLabel="vs previous"
          variant={kpis.coversDelta >= 0 ? "success" : "danger"}
          tooltip="Number of guests served. One cover = one diner. Rising covers signal demand; falling covers can foreshadow revenue dips."
        />
        <KpiTile
          label="PPA"
          value={fmtCurrency(kpis.ppa, { maximumFractionDigits: 2 })}
          delta={kpis.ppaDelta}
          deltaLabel="vs previous"
          variant={kpis.ppaDelta >= 0 ? "success" : "danger"}
          tooltip="Per Person Average — net sales divided by covers. Measures how much each guest spends. Driven by menu mix, upselling, and pricing."
        />
        <KpiTile
          label="Avg Check"
          value={fmtCurrency(kpis.avgCheck, { maximumFractionDigits: 2 })}
          delta={kpis.avgCheckDelta}
          deltaLabel="vs previous"
          variant={kpis.avgCheckDelta >= 0 ? "success" : "danger"}
          tooltip="Average ticket value per table (net sales ÷ tables served). Differs from PPA because tables seat multiple guests."
        />
        <KpiTile
          label="Discount %"
          value={`${kpis.discountPct.toFixed(1)}%`}
          delta={kpis.discountPctDelta}
          deltaLabel="vs previous"
          variant={kpis.discountPct > 5 ? "warning" : "default"}
          tooltip="Share of gross sales given away as discounts and comps. Healthy range is under 4%. Spikes can indicate service issues or staff overuse."
        />
      </div>

      {/* Trend + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Daily Trend" subtitle="Net sales by day" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "var(--color-foreground)",
                  }}
                  formatter={(value: number) => [fmtCurrency(value), "Net Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Live Alerts" subtitle="Requires attention">
          <div className="space-y-3">
            {demoAlerts.map((a, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2.5 rounded-sm border-l-2 bg-card/50 px-3 py-2.5",
                  a.severity === "danger" && "border-l-[var(--color-destructive)]",
                  a.severity === "warning" && "border-l-[var(--color-warning)]",
                  a.severity === "info" && "border-l-[var(--color-success)]"
                )}
              >
                {a.severity === "danger" && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-destructive)]" />}
                {a.severity === "warning" && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />}
                {a.severity === "info" && <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />}
                <div className="min-w-0">
                  <p className="text-[11px] leading-snug text-foreground">{a.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Day × Time Heatmap"
        subtitle="When the operation gets busy"
        tooltip="Shows demand intensity across days of the week and hours of the day. Darker cells mean busier slots. Use this to plan staffing, prep, and reservation availability. Toggle between guest count and revenue."
      >
        <DayTimeHeatmap center={search.center} defaultMetric="covers" />
      </Panel>
    </div>
  );
}
