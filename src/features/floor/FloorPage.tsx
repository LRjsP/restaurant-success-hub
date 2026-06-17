/**
 * The Floor — daily service pulse.
 * Display-only page: pulls data from useFloorData and composes presentational
 * sub-components. Keep new business logic out of this file.
 */
import { getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { DayTimeHeatmap } from "@/components/dashboard/Heatmap";
import { fmtCurrency, fmtNumber } from "@/lib/format";
import { useFloorData } from "./data";
import { OnboardingHint } from "./OnboardingHint";
import { SalesTrendChart } from "./SalesTrendChart";
import { AlertsList } from "./AlertsPanel";
import { KpiRowSkeleton, ChartSkeleton, HeatmapSkeleton } from "@/components/dashboard/Skeletons";

const layoutApi = getRouteApi("/_authenticated");

export function FloorPage() {
  const search = layoutApi.useSearch();
  const { kpis, alerts, isLoading } = useFloorData(search);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KpiRowSkeleton count={5} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel title="Daily Trend" subtitle="Net sales by day" className="lg:col-span-2">
            <ChartSkeleton />
          </Panel>
          <Panel title="Live Alerts" subtitle="Requires attention">
            <ChartSkeleton height="h-48" />
          </Panel>
        </div>
        <Panel title="Day × Time Heatmap" subtitle="When the operation gets busy">
          <HeatmapSkeleton />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OnboardingHint />

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
          tooltip="Per Person Average — net sales divided by covers. Measures how much each guest spends."
        />
        <KpiTile
          label="Avg Check"
          value={fmtCurrency(kpis.avgCheck, { maximumFractionDigits: 2 })}
          delta={kpis.avgCheckDelta}
          deltaLabel="vs previous"
          variant={kpis.avgCheckDelta >= 0 ? "success" : "danger"}
          tooltip="Average ticket value per table (net sales ÷ tables served)."
        />
        <KpiTile
          label="Discount %"
          value={`${kpis.discountPct.toFixed(1)}%`}
          delta={kpis.discountPctDelta}
          deltaLabel="vs previous"
          variant={kpis.discountPct > 5 ? "warning" : "default"}
          tooltip="Share of gross sales given away as discounts and comps. Healthy range is under 4%."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Daily Trend" subtitle="Net sales by day" className="lg:col-span-2">
          <SalesTrendChart data={kpis.trend} />
        </Panel>
        <Panel title="Live Alerts" subtitle="Requires attention">
          <AlertsList alerts={alerts} />
        </Panel>
      </div>

      <Panel
        title="Day × Time Heatmap"
        subtitle="When the operation gets busy"
        tooltip="Demand intensity across days of the week and hours. Darker = busier. Toggle between guests and revenue."
      >
        <DayTimeHeatmap center={search.center} defaultMetric="covers" />
      </Panel>
    </div>
  );
}
