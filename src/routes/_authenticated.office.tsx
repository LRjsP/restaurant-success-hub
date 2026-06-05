import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { DayTimeHeatmap } from "@/components/dashboard/Heatmap";
import {
  generateDemoDays,
  computeOfficePnl,
  daysForPreset,
} from "@/lib/demo-data";
import { fmtCurrency } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const layoutApi = getRouteApi("/_authenticated");

export const Route = createFileRoute("/_authenticated/office")({
  component: OfficePage,
});

function OfficePage() {
  const search = layoutApi.useSearch();
  const span = daysForPreset(search.range);
  const days = generateDemoDays(span, search.center);
  const prev = generateDemoDays(span, search.center, span);
  const pnl = computeOfficePnl(days, prev);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Net Revenue"
          value={fmtCurrency(pnl.netSales)}
          delta={pnl.netSalesDelta}
          deltaLabel="vs previous"
          variant={pnl.netSalesDelta >= 0 ? "success" : "danger"}
          tooltip="Total revenue after discounts and comps. The top line of the P&L — everything else is measured against this number."
        />
        <KpiTile
          label="Operating Profit"
          value={fmtCurrency(pnl.profit)}
          delta={pnl.profitDelta}
          deltaLabel={`${pnl.margin.toFixed(1)}% margin`}
          variant={pnl.profit >= 0 ? "success" : "danger"}
          tooltip="What's left after labor, cost of goods, and fixed costs (rent, utilities, insurance). Healthy independents target 8–15% margin."
        />
        <KpiTile
          label="Labor %"
          value={`${pnl.laborPct.toFixed(1)}%`}
          hint="Target < 30%"
          variant={pnl.laborPct > 32 ? "warning" : "default"}
          tooltip="Total labor cost as a share of net revenue. Includes wages, tips paid out, and payroll taxes. Above 32% usually signals overstaffing or weak sales."
        />
        <KpiTile
          label="COGS %"
          value={`${pnl.cogsPct.toFixed(1)}%`}
          hint="Target < 32%"
          variant={pnl.cogsPct > 33 ? "warning" : "default"}
          tooltip="Cost of Goods Sold as a share of net revenue — food and beverage purchases. Above target points to waste, theft, over-portioning, or supplier price creep."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Revenue vs Cost" subtitle="Daily breakdown" className="lg:col-span-3">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnl.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: "var(--color-foreground)" }}
                  formatter={(value: number) => fmtCurrency(value)}
                />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} />
                <Bar dataKey="value" name="Revenue" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cogs" name="COGS" fill="var(--color-chart-4)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="labor" name="Labor" fill="var(--color-chart-3)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="P&L Summary" subtitle="Period to date" className="lg:col-span-2">
          <div className="divide-y divide-border">
            {pnl.pnlRows.map((r) => (
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
        </Panel>
      </div>
    </div>
  );
}
