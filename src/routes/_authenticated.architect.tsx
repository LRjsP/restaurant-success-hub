import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import {
  generateDemoDays,
  computeMenuMatrix,
  daysForPreset,
  type MenuItem,
} from "@/lib/demo-data";
import { fmtCurrency, fmtNumber } from "@/lib/format";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const layoutApi = getRouteApi("/_authenticated");

const CLASS_COLOR: Record<MenuItem["classification"], string> = {
  Star: "var(--color-success)",
  Plowhorse: "var(--color-chart-3)",
  Puzzle: "var(--color-warning)",
  Dog: "var(--color-destructive)",
};

export const Route = createFileRoute("/_authenticated/architect")({
  component: ArchitectPage,
});

function ArchitectPage() {
  const search = layoutApi.useSearch();
  const span = daysForPreset(search.range);
  const days = generateDemoDays(span, search.center);
  const totalCovers = days.reduce((a, d) => a + d.covers, 0);
  const items = computeMenuMatrix(totalCovers).sort((a, b) => b.margin - a.margin);

  const totalRevenue = items.reduce((a, i) => a + i.revenue, 0);
  const totalMargin = items.reduce((a, i) => a + i.margin, 0);
  const blendedPct = totalRevenue ? (totalMargin / totalRevenue) * 100 : 0;
  const stars = items.filter((i) => i.classification === "Star").length;
  const dogs = items.filter((i) => i.classification === "Dog").length;
  const medianSold = median(items.map((i) => i.sold));
  const medianMargin = median(items.map((i) => i.margin));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Menu Revenue"
          value={fmtCurrency(totalRevenue)}
          hint={`${items.length} items`}
          tooltip="Total revenue attributed to menu items in this period. Driven by menu mix, pricing, and traffic."
        />
        <KpiTile
          label="Total Margin"
          value={fmtCurrency(totalMargin)}
          hint={`${blendedPct.toFixed(1)}% blended`}
          variant="success"
          tooltip="Contribution margin: revenue minus food cost across all menu items. Blended % is the weighted average margin — the higher, the more each dollar of sales drops to the bottom line."
        />
        <KpiTile
          label="Stars"
          value={String(stars)}
          hint="High pop · high margin"
          variant="success"
          tooltip="High-popularity, high-margin items. Your champions — protect their quality, feature them prominently, and never discount them."
        />
        <KpiTile
          label="Dogs"
          value={String(dogs)}
          hint="Consider removing"
          variant={dogs > 2 ? "warning" : "default"}
          tooltip="Low-popularity, low-margin items. Candidates for removal — they take up menu real estate and prep capacity without earning their keep."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Menu Engineering Matrix" subtitle="Volume Sold vs Margin ($)" className="lg:col-span-3">
          <div className="relative h-80 w-full">
            {/* Quadrant background labels */}
            <div className="pointer-events-none absolute inset-0 z-0">
              <span className="absolute left-[8%] top-[8%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">
                Puzzles
              </span>
              <span className="absolute right-[6%] top-[8%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">
                Stars
              </span>
              <span className="absolute left-[8%] bottom-[14%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">
                Dogs
              </span>
              <span className="absolute right-[6%] bottom-[14%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">
                Plowhorses
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  dataKey="sold"
                  name="Volume Sold"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Volume Sold (units)", position: "insideBottom", offset: -8, fontSize: 10, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  type="number"
                  dataKey="margin"
                  name="Margin ($)"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`
                  }
                />
                <ZAxis type="number" dataKey="revenue" range={[60, 400]} />
                <ReferenceLine
                  y={medianMargin}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
                <ReferenceLine
                  x={medianSold}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: "var(--color-foreground)" }}
                  formatter={(value: any, name: string) => {
                    if (name === "Margin ($)") return [fmtCurrency(Number(value)), name];
                    if (name === "Volume Sold") return [fmtNumber(value), name];
                    return [fmtCurrency(value), name];
                  }}
                  labelFormatter={(_, payload: any) => payload?.[0]?.payload?.name ?? ""}
                />
                <Scatter data={items}>
                  {items.map((i, idx) => (
                    <Cell key={idx} fill={CLASS_COLOR[i.classification]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {(["Star", "Plowhorse", "Puzzle", "Dog"] as const).map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_COLOR[c] }} />
                {c}
              </span>
            ))}
          </div>

          {/* Grouped menu item table */}
          <div className="mt-6 space-y-4">
            {(["Star", "Plowhorse", "Puzzle", "Dog"] as const).map((cls) => {
              const group = items.filter((i) => i.classification === cls);
              if (!group.length) return null;
              return (
                <div key={cls}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_COLOR[cls] }} />
                    <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {cls}s
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {group.length} item{group.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-1.5 pr-4 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                            Item
                          </th>
                          <th className="pb-1.5 pr-4 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                            Category
                          </th>
                          <th className="pb-1.5 pr-4 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground text-right">
                            Sold
                          </th>
                          <th className="pb-1.5 pr-4 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground text-right">
                            Margin
                          </th>
                          <th className="pb-1.5 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground text-right">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {group.map((i) => (
                          <tr key={i.name}>
                            <td className="py-1.5 pr-4 text-sm text-foreground">{i.name}</td>
                            <td className="py-1.5 pr-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {i.category}
                            </td>
                            <td className="py-1.5 pr-4 text-right font-mono text-sm tabular-nums text-foreground">
                              {fmtNumber(i.sold)}
                            </td>
                            <td className="py-1.5 pr-4 text-right font-mono text-sm tabular-nums text-foreground">
                              {fmtCurrency(i.margin)}
                            </td>
                            <td className="py-1.5 text-right font-mono text-sm tabular-nums text-foreground">
                              {fmtCurrency(i.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Top Performers" subtitle="By contribution margin" className="lg:col-span-2">
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
        </Panel>
      </div>
    </div>
  );
}
