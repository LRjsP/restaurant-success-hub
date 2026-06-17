/**
 * The Office — weekly P&L and operating margin.
 */
import { getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { DayTimeHeatmap } from "@/components/dashboard/Heatmap";
import { fmtCurrency } from "@/lib/format";
import { useOfficeData } from "./data";
import { RevenueVsCostChart } from "./RevenueVsCostChart";
import { PnlSummaryPanel } from "./PnlSummaryPanel";
import { KpiRowSkeleton, ChartSkeleton, HeatmapSkeleton } from "@/components/dashboard/Skeletons";

const layoutApi = getRouteApi("/_authenticated");

export function OfficePage() {
  const search = layoutApi.useSearch();
  const pnl = useOfficeData(search);

  if (pnl.isLoading) {
    return (
      <div className="space-y-6">
        <KpiRowSkeleton count={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel title="Revenue vs Cost" subtitle="Daily breakdown" className="lg:col-span-3">
            <ChartSkeleton height="h-72" />
          </Panel>
          <Panel title="P&L Summary" subtitle="Period to date" className="lg:col-span-2">
            <ChartSkeleton height="h-72" />
          </Panel>
        </div>
        <Panel title="Day × Time Heatmap" subtitle="Demand">
          <HeatmapSkeleton />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Net Revenue"
          value={fmtCurrency(pnl.netSales)}
          delta={pnl.netSalesDelta}
          deltaLabel="vs previous"
          variant={pnl.netSalesDelta >= 0 ? "success" : "danger"}
          tooltip="Total revenue after discounts and comps."
        />
        <KpiTile
          label="Operating Profit"
          value={fmtCurrency(pnl.profit)}
          delta={pnl.profitDelta}
          deltaLabel={`${pnl.margin.toFixed(1)}% margin`}
          variant={pnl.profit >= 0 ? "success" : "danger"}
          tooltip="Net of labor, COGS, and fixed costs. Healthy independents target 8–15%."
        />
        <KpiTile
          label="Labor %"
          value={`${pnl.laborPct.toFixed(1)}%`}
          hint="Target < 30%"
          variant={pnl.laborPct > 32 ? "warning" : "default"}
          tooltip="Total labor as a share of net revenue."
        />
        <KpiTile
          label="COGS %"
          value={`${pnl.cogsPct.toFixed(1)}%`}
          hint="Target < 32%"
          variant={pnl.cogsPct > 33 ? "warning" : "default"}
          tooltip="Cost of goods sold as a share of net revenue."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Revenue vs Cost" subtitle="Daily breakdown" className="lg:col-span-3">
          <RevenueVsCostChart data={pnl.series} />
        </Panel>
        <Panel title="P&L Summary" subtitle="Period to date" className="lg:col-span-2">
          <PnlSummaryPanel rows={pnl.pnlRows} />
        </Panel>
      </div>

      <Panel
        title="Labor Demand by Day-Part"
        subtitle="When the operation gets busy"
        tooltip="Demand across day × hour so labor cost can be aligned with revenue intensity."
      >
        <DayTimeHeatmap center={search.center} defaultMetric="netSales" />
      </Panel>
    </div>
  );
}
